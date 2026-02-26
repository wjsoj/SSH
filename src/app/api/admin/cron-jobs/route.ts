import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const cronJobs = await prisma.cronJob.findMany({
      include: {
        repository: {
          select: {
            id: true,
            owner: true,
            name: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cronJobs);
  } catch (error) {
    console.error("Error fetching cron jobs:", error);
    return NextResponse.json({ error: "Failed to fetch cron jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, repositoryId, schedule, enabled } = body;

    if (!name || !repositoryId || !schedule) {
      return NextResponse.json(
        { error: "Missing required fields: name, repositoryId, schedule" },
        { status: 400 },
      );
    }

    // Verify repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Validate cron expression
    const cronRegex =
      /^(\*|([0-9]|([0-5][0-9])))\s+(\*|([0-9]|([0-9][0-9])|(1[0-9]|2[0-3])))\s+(\*|([1-9]|[12][0-9]|3[01]))\s+(\*|([1-9]|1[0-2]))\s+(\*|[0-7])$/;
    if (!cronRegex.test(schedule)) {
      return NextResponse.json(
        { error: "Invalid cron expression. Use format: minute hour day month weekday" },
        { status: 400 },
      );
    }

    const cronJob = await prisma.cronJob.create({
      data: {
        name,
        repositoryId,
        schedule,
        enabled: enabled ?? true,
        nextRunAt: calculateNextRun(schedule),
      },
      include: {
        repository: {
          select: {
            id: true,
            owner: true,
            name: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(cronJob, { status: 201 });
  } catch (error) {
    console.error("Error creating cron job:", error);
    return NextResponse.json({ error: "Failed to create cron job" }, { status: 500 });
  }
}

function calculateNextRun(schedule: string): Date {
  const [minute, hour, day, month, weekday] = schedule.split(" ");
  const now = new Date();
  const next = new Date(now);

  // Simple calculation - just add 1 hour and adjust based on cron
  next.setHours(next.getHours() + 1);

  // Reset minutes to match cron
  if (minute !== "*") {
    next.setMinutes(parseInt(minute));
  } else {
    next.setMinutes(0);
  }

  return next;
}
