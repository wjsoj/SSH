"use client";

import { ArrowRight, CheckCircle, MessageSquare, Star } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useId, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

interface SkillsGridProps {
  initialSkills: Skill[];
  totalCount: number;
  pageSize?: number;
  paramName?: string;
}

export function SkillsGrid({
  initialSkills,
  totalCount,
  pageSize = 12,
  paramName = "skillPage",
}: SkillsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const headingId = useId();

  const currentPage = Number(searchParams.get(paramName) || 1);
  const totalPages = Math.ceil(totalCount / pageSize);

  const createPageURL = useCallback(
    (pageNumber: number) => {
      const params = new URLSearchParams(searchParams);
      if (pageNumber === 1) {
        params.delete(paramName);
      } else {
        params.set(paramName, pageNumber.toString());
      }
      return `?${params.toString()}`;
    },
    [searchParams, paramName],
  );

  const handlePageChange = (page: number) => {
    startTransition(() => {
      router.push(createPageURL(page), { scroll: false });
    });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalCount === 0) {
    return null;
  }

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
          <Star className="h-3 w-3" aria-hidden="true" />
          {totalCount} skills
        </Badge>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 ${isPending ? "opacity-50" : ""}`}
      >
        {initialSkills.map((skill) => (
          <Link
            key={skill.id}
            href={`/${skill.repository.owner}/${skill.repository.name}/${skill.slug}`}
            className="group block"
            aria-label={`View ${skill.name} skill`}
          >
            <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer border-muted">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                    {skill.name}
                  </CardTitle>
                  {skill.isVerified && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {skill.description || "No description available"}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {skill.repository.stars > 0 && (
                      <span className="flex items-center gap-1">
                        <Star
                          className="h-3.5 w-3.5 fill-primary text-primary"
                          aria-hidden="true"
                        />
                        {skill.repository.stars}
                      </span>
                    )}
                    {skill._count.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        {skill._count.comments}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`gap-1 px-2.5 sm:pl-2.5 h-9 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span className="hidden sm:block">Previous</span>
              </button>
            </PaginationItem>

            {getPageNumbers().map((page, index) =>
              page === "ellipsis" ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis items have no stable identity
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <button
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`h-9 w-9 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      currentPage === page ? "bg-muted text-foreground" : ""
                    }`}
                  >
                    {page}
                  </button>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`gap-1 px-2.5 sm:pr-2.5 h-9 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""}`}
              >
                <span className="hidden sm:block">Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </section>
  );
}
