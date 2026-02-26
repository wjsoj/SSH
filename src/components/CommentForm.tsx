"use client";

import { motion } from "framer-motion";
import { MessageSquare, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./RichTextEditor";

interface CommentFormProps {
  skillId: string;
  onCommentSubmit?: () => void;
}

export function CommentForm({ skillId, onCommentSubmit }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-dashed p-6 text-center"
      >
        <div className="mx-auto p-3 rounded-full w-fit mb-3">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Sign in to join the discussion</p>
      </motion.div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/skills/${skillId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setContent("");
        onCommentSubmit?.();
        toast.success("Comment posted!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to post comment");
      }
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-3"
    >
      <RichTextEditor value={content} onChange={setContent} disabled={submitting} />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
          {submitting ? (
            "Posting..."
          ) : (
            <>
              <Send className="mr-2 h-3.5 w-3.5" />
              Post Comment
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
}
