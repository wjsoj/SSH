import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRepository } from "@/lib/github-sync";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const submissions = await prisma.repositorySubmission.findMany({
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { submissionId, action, reviewNote } = body;

    if (!submissionId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: submissionId, action" },
        { status: 400 },
      );
    }

    const submission = await prisma.repositorySubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (action === "approve") {
      // Create repository first (sync will be handled via SSE endpoint)
      const repo = await createRepository({
        owner: submission.owner,
        name: submission.name,
        url: submission.url,
        skillsFolder: submission.skillsFolder,
        sourceType: submission.sourceType as "GITHUB" | "GITLAB" | "SELF_HOSTED",
      });

      // Update submission status
      await prisma.repositorySubmission.update({
        where: { id: submissionId },
        data: {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewNote: reviewNote || undefined,
        },
      });

      return NextResponse.json({ success: true, repositoryId: repo.id });
    } else if (action === "reject") {
      await prisma.repositorySubmission.update({
        where: { id: submissionId },
        data: {
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewNote: reviewNote || undefined,
        },
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing submission:", error);
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("id");

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    // Users can only delete their own pending submissions
    // Admins can delete any submission
    const submission = await prisma.repositorySubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.submittedById !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.repositorySubmission.delete({
      where: { id: submissionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}
