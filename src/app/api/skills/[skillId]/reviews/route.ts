import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> },
) {
  const { skillId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    const [reviews, total, skill] = await Promise.all([
      prisma.review.findMany({
        where: { skillId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { skillId } }),
      prisma.skill.findUnique({
        where: { id: skillId },
        select: { repository: { select: { stars: true } } },
      }),
    ]);

    const avgRating =
      reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

    return NextResponse.json({
      reviews,
      stats: {
        averageRating: avgRating,
        totalReviews: total,
        skillStars: skill?.repository?.stars || 0,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { skillId } = await params;

  try {
    const body = await request.json();
    const { rating } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Verify skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Check if user already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        skillId_userId: {
          skillId,
          userId: session.user.id!,
        },
      },
    });

    let review;
    if (existingReview) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: { rating },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          skillId,
          userId: session.user.id!,
          rating,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
