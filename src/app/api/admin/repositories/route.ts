import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRepository, syncRepository } from "@/lib/github-sync";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { owner, name, url, description, skillsFolder, sourceType } = body;

    if (!owner || !name || !url) {
      return NextResponse.json(
        { error: "Missing required fields: owner, name, url" },
        { status: 400 },
      );
    }

    // Extract owner and name from URL if not provided
    let finalOwner = owner;
    let finalName = name;

    if (url.includes("github.com")) {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        finalOwner = match[1];
        finalName = match[2].replace(/\.git$/, "");
      }
    }

    const repo = await createRepository({
      owner: finalOwner,
      name: finalName,
      url,
      description,
      skillsFolder,
      sourceType: sourceType || "GITHUB",
    });

    // Trigger sync
    try {
      await syncRepository(repo.id);
    } catch (syncError) {
      console.error("Sync error:", syncError);
      // Repository created but sync failed - still return success
    }

    return NextResponse.json(repo);
  } catch (error) {
    console.error("Error creating repository:", error);
    return NextResponse.json({ error: "Failed to create repository" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { prisma } = await import("@/lib/prisma");
  const repositories = await prisma.repository.findMany({
    include: {
      _count: {
        select: { skills: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(repositories);
}
