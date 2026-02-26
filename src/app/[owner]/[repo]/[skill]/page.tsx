import { ExternalLink, Github, MessageSquare, Star, Terminal } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { CommentForm } from "@/components/CommentForm";
import { CommentList } from "@/components/CommentList";
import { CopyButton } from "@/components/CopyButton";
import { Rating } from "@/components/Rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "highlight.js/styles/github-dark.css";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
    skill: string;
  }>;
}

async function getSkill(owner: string, repo: string, slug: string) {
  return prisma.skill.findFirst({
    where: {
      slug,
      repository: { owner, name: repo, isEnabled: true },
    },
    include: {
      repository: true,
      reviews: { select: { userId: true, rating: true } },
      _count: { select: { comments: true, reviews: true } },
    },
  });
}

export async function generateMetadata({ params }: PageProps) {
  const { owner, repo, skill } = await params;
  const skillData = await getSkill(owner, repo, skill);
  if (!skillData) return { title: "Skill Not Found" };
  return {
    title: `${skillData.name} - ${owner}/${repo}`,
    description: skillData.description || `Explore ${skillData.name} skill`,
  };
}

export default async function SkillPage({ params }: PageProps) {
  const { owner, repo, skill } = await params;
  const skillData = await getSkill(owner, repo, skill);
  const session = await getServerSession(authOptions);

  if (!skillData) notFound();

  const avgRating =
    skillData.reviews.length > 0
      ? skillData.reviews.reduce((acc, r) => acc + r.rating, 0) / skillData.reviews.length
      : 0;

  const userReview = session?.user?.id
    ? skillData.reviews.find((r) => r.userId === session.user.id)
    : null;

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-6xl">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
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
          {skillData.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <main className="lg:col-span-2 space-y-8">
          {/* Header */}
          <section aria-label="Skill overview">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl font-semibold tracking-tight">{skillData.name}</h1>
              {skillData.isVerified && (
                <Badge variant="secondary" className="self-start shrink-0">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {skillData.description ?? "AI agent skill for scientific research workflows."}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star
                  className={`h-4 w-4 ${skillData.repository.stars > 0 ? "fill-primary text-primary" : ""}`}
                  aria-hidden="true"
                />
                {skillData.repository.stars} stars
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                {skillData._count.comments} comments
              </span>
            </div>
          </section>

          {/* Install command */}
          {skillData.command && (
            <section aria-label="Install command">
              <div className="rounded-lg border bg-muted overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                    Install
                  </div>
                  <CopyButton text={skillData.command} />
                </div>
                <pre className="px-4 py-3 text-sm font-mono overflow-x-auto">
                  <code>{skillData.command}</code>
                </pre>
              </div>
            </section>
          )}

          {/* Documentation */}
          {skillData.readmeContent && (
            <section aria-label="Documentation">
              <h2 className="text-lg font-semibold mb-4">Documentation</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {skillData.readmeContent}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Comments */}
          <section aria-label="Community">
            <h2 className="text-lg font-semibold mb-4">
              Comments
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({skillData._count.comments})
              </span>
            </h2>
            {session ? (
              <CommentForm skillId={skillData.id} />
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">Sign in to leave a comment</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/login">
                      <Github className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                      Sign in with GitHub
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            <div className="mt-6">
              <CommentList
                skillId={skillData.id}
                skillOwner={owner}
                skillRepo={repo}
                skillSlug={skill}
              />
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Rating */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <output className="block">
                  <p className="text-4xl font-semibold tabular-nums">
                    {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {skillData._count.reviews} review{skillData._count.reviews !== 1 ? "s" : ""}
                  </p>
                </output>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-3">Your rating</p>
                <Rating skillId={skillData.id} userRating={userReview?.rating} />
              </div>
            </CardContent>
          </Card>

          {/* Repository info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Repository</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-medium">
                    {skillData.repository.owner[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{skillData.repository.owner}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {skillData.repository.name}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a
                  href={skillData.repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View source repository"
                >
                  <Github className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  View source
                  <ExternalLink
                    className="ml-auto h-3 w-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                </a>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
