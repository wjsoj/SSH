"use client";

import { Github, LogOut, Menu, Plus, Settings, User } from "lucide-react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl h-14 flex items-center justify-between px-4 md:px-6">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                aria-label="Open main menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pt-10 w-64">
              <SheetHeader>
                <SheetTitle className="text-left font-semibold">SSH</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6" aria-label="Mobile navigation">
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/">Home</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/">Browse</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/submit">Submit Skill</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="Scientific Skills Hub Home"
          >
            <span className="font-semibold text-sm">SSH</span>
            <span className="text-muted-foreground text-xs hidden sm:inline border-l pl-2.5">
              Scientific Skills Hub
            </span>
          </Link>

          <nav className="hidden md:flex items-center" aria-label="Main navigation">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Browse</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/submit">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Submit
              </Link>
            </Button>
          </nav>
        </div>

        {/* Right: theme + auth */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {status === "loading" ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  aria-label="User account menu"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={session.user?.image ?? undefined}
                      alt={session.user?.name ?? "User"}
                    />
                    <AvatarFallback className="text-xs font-medium">
                      {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {session.user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/submit" className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Skill
                  </Link>
                </DropdownMenuItem>
                {session.user?.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => signIn("github")}>
              <Github className="mr-2 h-3.5 w-3.5" />
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
