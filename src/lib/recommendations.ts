import type { Prisma } from "@prisma/client";

export interface SkillWithCounts {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  readmeContent: string | null;
  readmeHtml: string | null;
  isVerified: boolean;
  repositoryId: string;
  command: string | null;
  folderPath: string | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  repository: {
    id: string;
    owner: string;
    name: string;
    fullName: string;
    stars: number;
  };
  _count: {
    comments: number;
    reviews: number;
  };
  reviews?: Array<{ rating: number }>;
}

export interface RecommendationScore {
  skill: SkillWithCounts;
  score: number;
  breakdown: {
    stars: number;
    rating: number;
    engagement: number;
    recency: number;
  };
}

export type SortOption =
  | "popular" // Most stars
  | "rating" // Highest rated
  | "trending" // High engagement (comments + reviews)
  | "recent" // Recently added/updated
  | "recommended"; // AI-like recommendation score

const STAR_WEIGHT = 1.0;
const RATING_WEIGHT = 20.0;
const ENGAGEMENT_WEIGHT = 5.0;
const RECENCY_DAYS = 90;

export function calculateRecommendationScore(skill: SkillWithCounts): RecommendationScore {
  const reviews = skill.reviews || [];
  const totalReviews = skill._count.reviews;

  // Stars score (normalized, max 100)
  const starsScore = Math.min(skill.repository.stars, 100);

  // Rating score (average rating * weight)
  const avgRating =
    reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  const ratingScore = avgRating * RATING_WEIGHT;

  // Engagement score (comments + reviews, logarithmic scale)
  const totalEngagement = skill._count.comments + totalReviews;
  const engagementScore = Math.log10(totalEngagement + 1) * ENGAGEMENT_WEIGHT * 10;

  // Recency score (newer skills get a boost)
  const lastUpdated = skill.lastSyncedAt || skill.createdAt;
  const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - daysSinceUpdate / RECENCY_DAYS) * 50;

  const totalScore = starsScore + ratingScore + engagementScore + recencyScore;

  return {
    skill,
    score: Math.round(totalScore * 100) / 100,
    breakdown: {
      stars: Math.round(starsScore),
      rating: Math.round(ratingScore * 100) / 100,
      engagement: Math.round(engagementScore * 100) / 100,
      recency: Math.round(recencyScore * 100) / 100,
    },
  };
}

export function sortSkills(skills: SkillWithCounts[], sortBy: SortOption): SkillWithCounts[] {
  switch (sortBy) {
    case "popular":
      return [...skills].sort((a, b) => b.repository.stars - a.repository.stars);

    case "rating":
      return [...skills].sort((a, b) => {
        const aReviews = a.reviews || [];
        const bReviews = b.reviews || [];
        const aAvg =
          aReviews.length > 0
            ? aReviews.reduce((acc, r) => acc + r.rating, 0) / aReviews.length
            : 0;
        const bAvg =
          bReviews.length > 0
            ? bReviews.reduce((acc, r) => acc + r.rating, 0) / bReviews.length
            : 0;
        return bAvg - aAvg;
      });

    case "trending":
      return [...skills].sort(
        (a, b) => b._count.comments + b._count.reviews - (a._count.comments + a._count.reviews),
      );

    case "recent":
      return [...skills].sort(
        (a, b) =>
          new Date(b.lastSyncedAt || b.createdAt).getTime() -
          new Date(a.lastSyncedAt || a.createdAt).getTime(),
      );

    default: {
      const scored = skills.map(calculateRecommendationScore);
      scored.sort((a, b) => b.score - a.score);
      return scored.map((s) => s.skill);
    }
  }
}

export function getRecommendationReason(breakdown: RecommendationScore["breakdown"]): string {
  const parts: string[] = [];

  if (breakdown.stars >= 50) {
    parts.push("Popular");
  }
  if (breakdown.rating >= 80) {
    parts.push("Highly rated");
  }
  if (breakdown.engagement >= 30) {
    parts.push("Active community");
  }
  if (breakdown.recency >= 30) {
    parts.push("Recently updated");
  }

  return parts.length > 0 ? parts.join(" • ") : "Recommended for you";
}

export async function getRecommendedSkills() {
  return [];
}
