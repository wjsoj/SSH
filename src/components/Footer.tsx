"use client";

import { Github, Globe, Mail, Twitter } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background mt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-semibold text-sm">SSH</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              A platform for sharing and discovering AI-powered research skills. Built for the
              scientific community.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <span
                className="text-muted-foreground/40 cursor-not-allowed"
                title="Twitter (Coming Soon)"
              >
                <Twitter className="h-4 w-4" aria-hidden="true" />
              </span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub Repository"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
              </a>
              <span
                className="text-muted-foreground/40 cursor-not-allowed"
                title="Website (Coming Soon)"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
              </span>
              <span
                className="text-muted-foreground/40 cursor-not-allowed"
                title="Email (Coming Soon)"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-4">Platform</p>
            <ul className="space-y-3" aria-label="Platform links">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Skills
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Submit Repository
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-4">Resources</p>
            <ul className="space-y-3" aria-label="Resource links">
              <li>
                <a
                  href="https://skills.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skills CLI
                </a>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/40 cursor-not-allowed">
                  Documentation
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/40 cursor-not-allowed">
                  Privacy Policy
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Scientific Skills Hub
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
