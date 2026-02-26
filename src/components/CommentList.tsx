"use client";

import { motion } from "framer-motion";
import { MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface CommentListProps {
  skillId: string;
  skillOwner: string;
  skillRepo: string;
  skillSlug: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

export function CommentList({ skillId, skillOwner, skillRepo, skillSlug }: CommentListProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchComments = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/skills/${skillId}/comments?page=${pageNum}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
        setTotalPages(data.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [skillId]);

  const handleDelete = async (commentId: string) => {
    setConfirmDeleteId(null);
    setDeleting(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
        toast.success("Comment deleted");
      } else {
        toast.error("Failed to delete comment");
      }
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-4 rounded-xl border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 border-2 border-dashed rounded-xl"
      >
        <div className="p-3 rounded-full w-fit mx-auto mb-3">
          <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground font-medium">No discussion yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Be the first to share your experience.</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {comments.map((comment) => (
        <motion.div
          key={comment.id}
          variants={item}
          className="flex gap-4 p-5 rounded-xl border hover: transition-colors group relative"
        >
          <Avatar className="h-10 w-10 ring-1">
            <AvatarImage src={comment.user.image || ""} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {comment.user.name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/${skillOwner}/${skillRepo}/${skillSlug}`}
                  className="font-semibold hover:text-primary transition-colors text-sm"
                >
                  {comment.user.name || "Unknown User"}
                </Link>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              {session?.user?.id === comment.user.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500 -mr-2"
                  onClick={() => setConfirmDeleteId(comment.id)}
                  disabled={deleting === comment.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground/90 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: comment content is sanitized server-side before storage
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          </div>
        </motion.div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchComments(page - 1)}
            disabled={page === 1}
            className=""
          >
            Previous
          </Button>
          <span className="text-sm font-mono text-muted-foreground px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchComments(page + 1)}
            disabled={page === totalPages}
            className=""
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete comment?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
