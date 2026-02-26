import {
  Clock,
  Cog,
  Database,
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  ShieldOff,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You need to be signed in to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.user.role !== "ADMIN") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <ShieldOff className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to view this page. Admin access is required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Go home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [repoCount, skillCount, userCount, reviewCount, commentCount] = await Promise.all([
    prisma.repository.count(),
    prisma.skill.count(),
    prisma.user.count(),
    prisma.review.count(),
    prisma.comment.count(),
  ]);

  const stats = [
    { label: "Repositories", value: repoCount, icon: Database },
    { label: "Skills", value: skillCount, icon: Settings },
    { label: "Users", value: userCount, icon: Users },
    { label: "Reviews", value: reviewCount, icon: Star },
    { label: "Comments", value: commentCount, icon: MessageSquare },
  ];

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="mb-8" />

      {/* Management sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Repositories
            </CardTitle>
            <CardDescription>Manage skill repositories</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild size="sm">
              <Link href="/admin/repositories">
                <Plus className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Add Repository
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/repositories">View All</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <RefreshCw className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Sync
            </CardTitle>
            <CardDescription>Synchronize skills from repositories</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/admin/repositories">
                <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Sync Now
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Cron Jobs
            </CardTitle>
            <CardDescription>Schedule automatic syncs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/admin/cron-jobs">
                <Clock className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Manage Jobs
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Users
            </CardTitle>
            <CardDescription>Manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/admin/users">View Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Moderation
            </CardTitle>
            <CardDescription>Manage comments and reviews</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/comments">
                <MessageSquare className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Comments
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/reviews">
                <Star className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Reviews
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Cog className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Settings
            </CardTitle>
            <CardDescription>Configure system settings</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/submissions">
                <Star className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Submissions
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/settings">
                <Settings className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
