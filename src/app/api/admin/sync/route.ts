import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncRepository } from "@/lib/github-sync";

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
    const { repositoryId } = body;

    if (!repositoryId) {
      return NextResponse.json({ error: "Missing required field: repositoryId" }, { status: 400 });
    }

    const result = await syncRepository(repositoryId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Failed to sync repository" }, { status: 500 });
  }
}
