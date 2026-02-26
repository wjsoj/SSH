"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, Shield, Terminal, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  stats: {
    repoCount: number;
    skillCount: number;
    userCount: number;
  };
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function HeroSection({ stats }: HeroSectionProps) {
  const [copied, setCopied] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const command = "npx skills add vercel-react-best-practices";

  const copyCommand = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resolvedContainer = shouldReduceMotion ? {} : container;
  const resolvedItem = shouldReduceMotion ? {} : item;

  return (
    <section className="relative pt-24 pb-20 px-4 overflow-hidden" aria-label="Hero">
      {/* Ambient blobs */}
      <div className="hero-glow-1 top-[-100px] left-1/2 -translate-x-1/2" aria-hidden="true" />
      <div className="hero-glow-2 top-[60px] right-[10%]" aria-hidden="true" />

      <motion.div
        className="container mx-auto max-w-4xl text-center"
        variants={resolvedContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={resolvedItem}>
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" aria-hidden="true" />
            AI-Powered Research Skills
          </Badge>
        </motion.div>

        <motion.h1
          variants={resolvedItem}
          className="text-4xl md:text-6xl font-semibold tracking-tight mb-5 leading-tight"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.85 0.08 240) 0%, oklch(0.62 0.2 255) 40%, oklch(0.75 0.18 200) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Scientific Skills Hub
        </motion.h1>

        <motion.p
          variants={resolvedItem}
          className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Discover, share, and deploy verified AI agent skills for scientific research workflows.
        </motion.p>

        {/* Terminal command */}
        <motion.div variants={resolvedItem}>
          <div className="inline-flex items-center gap-3 bg-muted rounded-lg px-4 py-3 mb-10 font-mono text-sm border terminal-glow">
            <Terminal className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <code className="text-foreground">{command}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 ml-1"
              onClick={copyCommand}
              aria-label={copied ? "Copied" : "Copy command"}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        {(stats.skillCount > 0 || stats.repoCount > 0) && (
          <motion.div
            variants={resolvedItem}
            className="flex flex-wrap justify-center gap-8 mb-10 text-sm text-muted-foreground"
          >
            <span>
              <strong className="text-foreground font-semibold">{stats.skillCount}</strong> skills
            </span>
            <span>
              <strong className="text-foreground font-semibold">{stats.repoCount}</strong>{" "}
              repositories
            </span>
            <span>
              <strong className="text-foreground font-semibold">{stats.userCount}</strong> users
            </span>
          </motion.div>
        )}

        {/* Feature pills */}
        <motion.div variants={resolvedItem} className="flex flex-wrap justify-center gap-3">
          {[
            { icon: Zap, label: "Instant Setup" },
            { icon: Shield, label: "Verified Skills" },
            { icon: Terminal, label: "CLI Ready" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border rounded-full px-3 py-1.5"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
