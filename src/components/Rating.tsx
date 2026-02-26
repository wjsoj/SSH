"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RatingProps {
  skillId: string;
  initialRating?: number;
  userRating?: number;
  onRatingChange?: (rating: number) => void;
}

export function Rating({ skillId, initialRating = 0, userRating, onRatingChange }: RatingProps) {
  const [rating, setRating] = useState(userRating || initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleRating = async (value: number) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/skills/${skillId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });

      if (res.ok) {
        setRating(value);
        onRatingChange?.(value);
        toast.success("Rating submitted!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit rating");
      }
    } catch {
      toast.error("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={submitting}
            onClick={() => handleRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 transition-all duration-200 hover:scale-125 disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-all duration-300 ${
                value <= (hoverRating || rating)
                  ? "fill-yellow-500 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]"
                  : "text-muted-foreground/20 fill-transparent group-hover:text-yellow-500/40"
              } ${value <= rating && !hoverRating ? "animate-in zoom-in-75 duration-300" : ""}`}
            />
          </button>
        ))}
      </div>
      <div className="h-4">
        {userRating ? (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold text-primary/80 uppercase tracking-widest"
          >
            Confirmed: {userRating} Stars
          </motion.p>
        ) : (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-medium">
            Awaiting assessment
          </p>
        )}
      </div>
    </div>
  );
}
