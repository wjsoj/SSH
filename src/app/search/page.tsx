import { CheckCircle, MessageSquare, Search, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { type SkillWithCounts, sortSkills } from "@/lib/recommendations";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
  }>;
}

async function searchSkills(query: string, sortBy = "recommended"): Promise<SkillWithCounts[]> {
  const skills = (await prisma.skill.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
        { repository: { owner: { contains: query } } },
        { repository: { name: { contains: query } } },
      ],
      repository: { isEnabled: true },
    },
    include: {
      repository: { select: { id: true, owner: true, name: true, fullName: true, stars: true } },
      _count: { select: { comments: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
    take: 100,
  })) as unknown as SkillWithCounts[];

  return sortSkills(
    skills,
    sortBy as "popular" | "rating" | "trending" | "recent" | "recommended",
  ).slice(0, 50);
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q} - SSH` : "Search - SSH" };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, sort } = await searchParams;
  const query = q || "";
  const sortBy = sort || "recommended";
  const skills = query ? await searchSkills(query, sortBy) : [];

  const sortOptions = ["recommended", "popular", "rating", "trending", "recent"];

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {query ? `Results for "${query}"` : "Search Skills"}
          </h1>
          {query && (
            <p className="text-sm text-muted-foreground mt-1">
              {skills.length} skill{skills.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {query && (
          <div className="flex flex-wrap gap-1.5">
            {sortOptions.map((s) => (
              <Link key={s} href={`/search?q=${query}&sort=${s}`}>
                <Badge
                  variant={sortBy === s ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                >
                  {s}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {skills.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/${skill.repository.owner}/${skill.repository.name}/${skill.slug}`}
              className="group block"
              aria-label={`View ${skill.name}`}
            >
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                      {skill.name}
                    </CardTitle>
                    {skill.isVerified && (
                      <CheckCircle
                        className="h-4 w-4 text-primary shrink-0 mt-0.5"
                        aria-label="Verified"
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {skill.repository.owner}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {skill.description ?? "No description available"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star
                        className={`h-3.5 w-3.5 ${skill.repository.stars > 0 ? "fill-primary text-primary" : ""}`}
                        aria-hidden="true"
                      />
                      {skill.repository.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      {skill._count.comments}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : query ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-lg">
          <Search className="h-8 w-8 text-muted-foreground mb-4" aria-hidden="true" />
          <h3 className="text-base font-medium mb-1">No results found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No skills matched &ldquo;{query}&rdquo;. Try a different search term.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-8 w-8 text-muted-foreground mb-4" aria-hidden="true" />
          <h2 className="text-base font-medium mb-1">Search for skills</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Enter a search term to discover AI skills and research tools.
          </p>
        </div>
      )}
    </div>
  );
}
