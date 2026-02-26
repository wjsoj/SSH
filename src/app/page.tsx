import { ArrowRight, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CollectionsGrid } from "@/components/CollectionsGrid";
import { SkillsGrid } from "@/components/SkillsGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { type SkillWithCounts, sortSkills } from "@/lib/recommendations";
import { HeroSection } from "./HeroSection";

const SKILLS_PAGE_SIZE = 12;
const REPOS_PAGE_SIZE = 6;

async function getSkills(page: number = 1) {
  const skip = (page - 1) * SKILLS_PAGE_SIZE;

  const [skills, totalCount] = await Promise.all([
    prisma.skill.findMany({
      take: SKILLS_PAGE_SIZE,
      skip,
      include: {
        repository: { select: { owner: true, name: true, stars: true } },
        _count: { select: { comments: true, reviews: true } },
        reviews: { select: { rating: true } },
      },
    }),
    prisma.skill.count(),
  ]);

  return {
    skills: sortSkills(skills as SkillWithCounts[], "recommended"),
    totalCount,
  };
}

async function getRepositories(page: number = 1) {
  const skip = (page - 1) * REPOS_PAGE_SIZE;

  const [repositories, totalCount] = await Promise.all([
    prisma.repository.findMany({
      where: { isEnabled: true },
      take: REPOS_PAGE_SIZE,
      skip,
      include: { _count: { select: { skills: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.repository.count({ where: { isEnabled: true } }),
  ]);

  return { repositories, totalCount };
}

async function getStats() {
  const [repoCount, skillCount, userCount] = await Promise.all([
    prisma.repository.count({ where: { isEnabled: true } }),
    prisma.skill.count(),
    prisma.user.count(),
  ]);
  return { repoCount, skillCount, userCount };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; skillPage?: string }>;
}) {
  const { page, skillPage } = await searchParams;
  const currentPage = Number(page) || 1;
  const currentSkillPage = Number(skillPage) || 1;

  const [{ skills, totalCount: skillCount }, { repositories, totalCount: repoCount }, stats] =
    await Promise.all([getSkills(currentSkillPage), getRepositories(currentPage), getStats()]);

  const hasContent = stats.skillCount > 0 || stats.repoCount > 0;

  return (
    <div className="min-h-screen pb-16">
      <HeroSection stats={stats} />

      {/* Search */}
      <section className="px-4 pb-12" aria-label="Search">
        <div className="container mx-auto max-w-2xl">
          <form action="/search" method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="text"
                name="q"
                placeholder="Search skills, repositories..."
                aria-label="Search skills and repositories"
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
      </section>

      {hasContent ? (
        <>
          {/* Stats */}
          <section
            className="container mx-auto max-w-7xl px-4 md:px-6 pb-10"
            aria-label="Statistics"
          >
            <div className="flex gap-8 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground font-semibold tabular-nums">
                  {stats.repoCount}
                </strong>{" "}
                repositories
              </span>
              <span>
                <strong className="text-foreground font-semibold tabular-nums">
                  {stats.skillCount}
                </strong>{" "}
                skills
              </span>
              <span>
                <strong className="text-foreground font-semibold tabular-nums">
                  {stats.userCount}
                </strong>{" "}
                users
              </span>
            </div>
          </section>

          {/* Trending Skills with pagination */}
          <Suspense
            fallback={
              <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8 text-muted-foreground text-sm">
                Loading skills...
              </div>
            }
          >
            <SkillsGrid
              initialSkills={skills}
              totalCount={skillCount}
              pageSize={SKILLS_PAGE_SIZE}
            />
          </Suspense>

          {/* Collections with pagination */}
          <Suspense
            fallback={
              <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8 text-muted-foreground text-sm">
                Loading collections...
              </div>
            }
          >
            <CollectionsGrid
              initialRepositories={repositories}
              totalCount={repoCount}
              pageSize={REPOS_PAGE_SIZE}
            />
          </Suspense>
        </>
      ) : (
        /* Empty state */
        <section className="container mx-auto max-w-7xl px-4 md:px-6 py-16">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center text-center py-16 px-4">
              <div className="p-4 rounded-full bg-muted mb-6" aria-hidden="true">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">No skills yet</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Connect your first repository to start building the scientific skill ecosystem.
              </p>
              <Button asChild>
                <Link href="/admin">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
