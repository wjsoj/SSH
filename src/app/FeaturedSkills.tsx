"use client";

import { CheckCircle, MessageSquare, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isVerified: boolean;
  repository: {
    owner: string;
    name: string;
    stars: number;
  };
  _count: {
    comments: number;
    reviews: number;
  };
}

interface FeaturedSkillsProps {
  skills: Skill[];
}

export function FeaturedSkills({ skills }: FeaturedSkillsProps) {
  const headingId = useId();

  return (
    <section className="container mx-auto max-w-7xl px-4 md:px-6 py-16" aria-labelledby={headingId}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 id={headingId} className="text-xl font-semibold tracking-tight">
            Trending Skills
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Most popular skills from the scientific community
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 self-start sm:self-auto">
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <Link
            key={skill.id}
            href={`/${skill.repository.owner}/${skill.repository.name}/${skill.slug}`}
            className="group block"
            aria-label={`View ${skill.name} skill`}
          >
            <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                    {skill.name}
                  </CardTitle>
                  {skill.isVerified && (
                    <CheckCircle
                      className="h-4 w-4 text-primary shrink-0 mt-0.5"
                      aria-label="Verified skill"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {skill.repository.owner}/{skill.repository.name}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {skill.description ?? "AI agent skill for scientific workflows."}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
    </section>
  );
}
