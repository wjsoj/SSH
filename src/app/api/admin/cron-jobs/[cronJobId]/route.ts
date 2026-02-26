import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cronJobId: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { cronJobId } = await params;
    const body = await request.json();
    const { name, schedule, enabled } = body;

    const existing = await prisma.cronJob.findUnique({
      where: { id: cronJobId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    const updateData: { name?: string; schedule?: string; enabled?: boolean; nextRunAt?: Date } =
      {};

    if (name !== undefined) updateData.name = name;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (schedule !== undefined) {
      // Validate cron expression
      const cronRegex =
        /^(\*|([0-9]|([0-5][0-9])))\s+(\*|([0-9]|([0-9][0-9])|(1[0-9]|2[0-3])))\s+(\*|([1-9]|[12][0-9]|3[01]))\s+(\*|([1-9]|1[0-2]))\s+(\*|[0-7])$/;
      if (!cronRegex.test(schedule)) {
        return NextResponse.json({ error: "Invalid cron expression" }, { status: 400 });
      }
      updateData.schedule = schedule;
      updateData.nextRunAt = calculateNextRun(schedule);
    }

    const cronJob = await prisma.cronJob.update({
      where: { id: cronJobId },
      data: updateData,
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

    return NextResponse.json(cronJob);
  } catch (error) {
    console.error("Error updating cron job:", error);
    return NextResponse.json({ error: "Failed to update cron job" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ cronJobId: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { cronJobId } = await params;

    const existing = await prisma.cronJob.findUnique({
      where: { id: cronJobId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    await prisma.cronJob.delete({
      where: { id: cronJobId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cron job:", error);
    return NextResponse.json({ error: "Failed to delete cron job" }, { status: 500 });
  }
}

function calculateNextRun(schedule: string): Date {
  const [minute, hour] = schedule.split(" ");
  const now = new Date();
  const next = new Date(now);

  next.setHours(next.getHours() + 1);

  if (minute !== "*") {
    next.setMinutes(parseInt(minute));
  } else {
    next.setMinutes(0);
  }

  return next;
}
