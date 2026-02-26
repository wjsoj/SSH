"use client";

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

export function HeroSection({ stats }: HeroSectionProps) {
  const [copied, setCopied] = useState(false);
  const command = "npx skills add vercel-react-best-practices";

  const copyCommand = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-24 pb-20 px-4" aria-label="Hero">
      <div className="container mx-auto max-w-4xl text-center">
        <Badge variant="secondary" className="mb-6 gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          AI-Powered Research Skills
        </Badge>

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-5 leading-tight">
          Scientific Skills Hub
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
          Discover, share, and deploy verified AI agent skills for scientific research workflows.
        </p>

        {/* Terminal command */}
        <div className="inline-flex items-center gap-3 bg-muted rounded-lg px-4 py-3 mb-10 font-mono text-sm border">
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

        {/* Stats */}
        {(stats.skillCount > 0 || stats.repoCount > 0) && (
          <div className="flex flex-wrap justify-center gap-8 mb-10 text-sm text-muted-foreground">
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
          </div>
        )}

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3">
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
        </div>
      </div>
    </section>
  );
}
