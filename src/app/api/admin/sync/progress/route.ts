import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SyncProgress, syncRepository } from "@/lib/github-sync";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get("submissionId");

  if (!submissionId) {
    return new Response("Missing submissionId", { status: 400 });
  }

  // Get submission
  const submission = await prisma.repositorySubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return new Response("Submission not found", { status: 404 });
  }

  // Find the repository that was created by the PATCH endpoint
  const repo = await prisma.repository.findFirst({
    where: {
      owner: submission.owner,
      name: submission.name,
    },
  });

  if (!repo) {
    return new Response("Repository not found. Please try approving again.", { status: 404 });
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();

  // Use an object to hold the callback to avoid closure type issues
  const state = {
    controller: null as ReadableStreamDefaultController<Uint8Array> | null,
    callback: null as ((progress: SyncProgress) => void) | null,
  };

  const stream = new ReadableStream({
    start(controller) {
      state.controller = controller;
      state.callback = (progress: SyncProgress) => {
        const data = `data: ${JSON.stringify(progress)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };
    },
  });

  // Start sync in background
  (async () => {
    try {
      await syncRepository(repo.id, state.callback!);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (state.callback) {
        state.callback({
          status: "error",
          message: `Error: ${errorMessage}`,
        });
      }
    }
  })();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
