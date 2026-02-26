import { Calendar, MessageSquare, Shield, Star, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      comments: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          skill: {
            include: {
              repository: {
                select: { owner: true, name: true },
              },
            },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          skill: {
            include: {
              repository: {
                select: { owner: true, name: true },
              },
            },
          },
        },
      },
      _count: {
        select: { comments: true, reviews: true },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Sidebar */}
        <div className="lg:col-span-4">
          <Card className="sticky top-20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3">
                <Avatar className="h-16 w-16 mx-auto">
                  <AvatarImage src={user.image || ""} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {user.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-lg font-semibold">{user.name || "Unknown User"}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex justify-center">
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                  <Shield className="mr-1.5 h-3 w-3" />
                  {user.role}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y">
                <div className="text-center">
                  <p className="text-2xl font-semibold tabular-nums">{user._count.comments}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Comments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold tabular-nums">{user._count.reviews}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Reviews</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined{" "}
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-8 space-y-8">
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Star className="h-4 w-4 text-primary" />
                    Recent Reviews
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Skills you have rated and reviewed
                  </CardDescription>
                </div>
                <Badge variant="secondary">{user.reviews.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {user.reviews.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg text-sm text-muted-foreground">
                  No reviews yet
                </div>
              ) : (
                <div className="space-y-1">
                  {user.reviews.map((review) => (
                    <Link
                      key={review.id}
                      href={`/${review.skill.repository.owner}/${review.skill.repository.name}/${review.skill.slug}`}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.skill.repository.owner} />
                        <AvatarFallback>
                          {review.skill.repository.owner[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate text-foreground group-hover:text-primary transition-colors">
                            {review.skill.repository.owner}/{review.skill.name}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                // biome-ignore lint/suspicious/noArrayIndexKey: simple decorative star list
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
                              />
                            ))}
                          </div>{" "}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Rated on {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Recent Comments
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Discussions you've participated in
                  </CardDescription>
                </div>
                <Badge variant="secondary">{user.comments.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {user.comments.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg text-sm text-muted-foreground">
                  No comments yet
                </div>
              ) : (
                <div className="space-y-1">
                  {user.comments.map((comment) => (
                    <Link
                      key={comment.id}
                      href={`/${comment.skill.repository.owner}/${comment.skill.repository.name}/${comment.skill.slug}`}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.skill.repository.owner} />
                        <AvatarFallback>
                          {comment.skill.repository.owner[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate text-foreground group-hover:text-primary transition-colors">
                            {comment.skill.repository.owner}/{comment.skill.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
