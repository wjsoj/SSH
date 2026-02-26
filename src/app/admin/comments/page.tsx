"use client";

import { ExternalLink, MessageSquare, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  skill: {
    id: string;
    name: string;
    slug: string;
    repository: {
      owner: string;
      name: string;
    };
  };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchComments();
  }, [search, page]);

  async function fetchComments() {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/comments?${params}`);
      const data = await res.json();
      setComments(data.comments);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch("/api/admin/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });

      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Comment Moderation</h1>
      </div>

      <Card className="">
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>Review and manage user discussion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search comments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="">
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Loading comments...
                    </TableCell>
                  </TableRow>
                ) : comments.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No comments found
                    </TableCell>
                  </TableRow>
                ) : (
                  comments.map((comment) => (
                    <TableRow key={comment.id} className="hover: transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user.image || ""} />
                            <AvatarFallback className="bg-white/10">
                              {comment.user.name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{comment.user.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{comment.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="line-clamp-2 text-sm text-muted-foreground/90">
                          {comment.content}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/${comment.skill.repository.owner}/${comment.skill.repository.name}/${comment.skill.slug}`}
                          className="flex items-center gap-1 hover:underline text-sm font-medium"
                        >
                          <span>{comment.skill.name}</span>
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono">
                          {comment.skill.repository.owner}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteComment(comment.id)}
                          className="hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className=""
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground font-mono px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className=""
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
