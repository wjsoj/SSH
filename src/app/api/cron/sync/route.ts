import { NextRequest, NextResponse } from "next/server";
import { syncRepository } from "@/lib/github-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface SyncResult {
  success: boolean;
  repositoryId: string;
  skillsAdded: number;
  skillsUpdated: number;
  errors: string[];
  syncedAt: Date;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Check cron secret if configured
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { repositoryId } = body;

    const results: SyncResult[] = [];

    // Get repositories to sync
    const repositories = repositoryId
      ? [await prisma.repository.findUnique({ where: { id: repositoryId } })]
      : await prisma.repository.findMany({
          where: { isEnabled: true },
        });

    for (const repo of repositories) {
      if (!repo) continue;

      try {
        const syncResult = await syncRepository(repo.id);
        results.push({
          success: true,
          repositoryId: repo.id,
          skillsAdded: syncResult.synced,
          skillsUpdated: 0,
          errors: [],
          syncedAt: new Date(),
        });

        // Update last synced time
        await prisma.repository.update({
          where: { id: repo.id },
          data: { lastSyncedAt: new Date() },
        });
      } catch (error) {
        results.push({
          success: false,
          repositoryId: repo.id,
          skillsAdded: 0,
          skillsUpdated: 0,
          errors: [error instanceof Error ? error.message : "Unknown error"],
          syncedAt: new Date(),
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Synced ${successful} repositories, ${failed} failed`,
      results,
    });
  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ error: "Failed to sync repositories" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Use POST to trigger sync",
    repositories: await prisma.repository.count({
      where: { isEnabled: true },
    }),
  });
}
