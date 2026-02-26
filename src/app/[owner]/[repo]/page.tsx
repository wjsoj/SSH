import { ExternalLink, Github, Terminal } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { type SkillWithCounts, sortSkills } from "@/lib/recommendations";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

async function getRepository(owner: string, repo: string) {
  const repository = await prisma.repository.findFirst({
    where: {
      owner,
      name: repo,
      isEnabled: true,
    },
    include: {
      skills: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (repository) {
    const skillsWithCounts = repository.skills.map((skill) => ({
      ...skill,
      repository: {
        id: repository.id,
        owner: repository.owner,
        name: repository.name,
        fullName: repository.fullName,
        stars: repository.stars,
      },
      _count: { comments: 0, reviews: 0 },
      reviews: [],
    })) as unknown as SkillWithCounts[];
    repository.skills = sortSkills(skillsWithCounts, "recommended");
  }

  return repository;
}

export async function generateMetadata({ params }: PageProps) {
  const { owner, repo } = await params;

  return {
    title: `${owner}/${repo} - SSH`,
    description: `Browse skills from ${owner}/${repo}`,
  };
}

export default async function RepoPage({ params }: PageProps) {
  const { owner, repo } = await params;
  const repository = await getRepository(owner, repo);

  if (!repository) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-7xl">
      <div className="mb-8">
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${owner}/${repo}`} className="hover:text-foreground transition-colors">
            {owner}/{repo}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground" aria-current="page">
            {repository.name}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              {repository.name}
              <Badge variant="secondary" className="text-xs">
                {repository.sourceType}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {repository.description || `${owner}/${repository.name} skills repository`}
            </p>
          </div>
          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 shrink-0"
            aria-label="View source repository"
          >
            <Button variant="outline" size="sm">
              <Github className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              View Repository
              <ExternalLink className="ml-2 h-3 w-3 text-muted-foreground" aria-hidden="true" />
            </Button>
          </a>
        </div>
      </div>

      {repository.skills.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {repository.skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/${owner}/${repository.name}/${skill.slug}`}
              className="group block"
              aria-label={`View ${skill.name}`}
            >
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
                      {skill.name}
                    </CardTitle>
                    {skill.isVerified && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {skill.description ?? "No description available"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-lg">
          <Terminal className="h-8 w-8 text-muted-foreground mb-4" aria-hidden="true" />
          <h3 className="text-base font-medium mb-1">No skills found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            This repository doesn't have any skills listed yet.
          </p>
        </div>
      )}
    </div>
  );
}
