"use client";

import { CheckCircle, Clock, Github, Loader2, Plus, Send, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Submission {
  id: string;
  url: string;
  owner: string;
  name: string;
  skillsFolder: string;
  status: string;
  createdAt: string;
}

export default function SubmitPage() {
  const { data: session, status: sessionStatus } = useSession();
  const id = useId();
  const [url, setUrl] = useState("");
  const [skillsFolder, setSkillsFolder] = useState("skills");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  async function fetchSubmissions() {
    setLoadingSubmissions(true);
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  // Fetch submissions when user is authenticated
  useEffect(() => {
    if (session && submissions.length === 0 && !loadingSubmissions) {
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, skillsFolder }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit");
        return;
      }

      setSuccess("Submission received! Our team will review it shortly.");
      setUrl("");
      fetchSubmissions();
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSubmission(id: string) {
    if (!confirm("Are you sure you want to delete this submission?")) return;

    try {
      const res = await fetch(`/api/submissions?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSubmissions(submissions.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Error deleting submission:", err);
    }
  }

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-md mx-auto text-center">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Sign in to Submit</CardTitle>
              <CardDescription>
                Join the community to contribute your own skill repositories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">
                  <Github className="mr-2 h-4 w-4" />
                  Sign in with GitHub
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Submit Repository</h1>
          <p className="text-xl text-muted-foreground">
            Share your research skills with the global scientific community.
          </p>
        </div>

        <Card className="mb-10">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-primary" />
              New Submission
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              Enter the URL of a public GitHub repository containing your skills.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor={`${id}-url`} className="text-foreground font-medium">
                  GitHub Repository URL
                </Label>
                <Input
                  id={`${id}-url`}
                  placeholder="https://github.com/owner/repo"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground ml-1">
                  Supports full repo URLs or specific subfolders.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-skills-folder`} className="text-foreground font-medium">
                  Skills Folder{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id={`${id}-skills-folder`}
                  placeholder="skills"
                  value={skillsFolder}
                  onChange={(e) => setSkillsFolder(e.target.value)}
                  className="h-10 font-mono"
                />
                <p className="text-xs text-muted-foreground ml-1">
                  The folder containing skills (default: "skills"). For example: "scientific-skills"
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit for Review
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {submissions.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight">Your Submissions</h3>
            <div className="grid gap-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="transition-colors">
                  <CardContent className="p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <a
                          href={submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-medium text-primary hover:underline text-lg"
                        >
                          {submission.owner}/{submission.name}
                        </a>
                        <Badge
                          variant="outline"
                          className={`border bg-opacity-10 px-2 py-0.5 ${
                            submission.status === "PENDING"
                              ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              : submission.status === "APPROVED"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}
                        >
                          {submission.status === "PENDING" && <Clock className="h-3 w-3 mr-1.5" />}
                          {submission.status === "APPROVED" && (
                            <CheckCircle className="h-3 w-3 mr-1.5" />
                          )}
                          {submission.status === "REJECTED" && (
                            <XCircle className="h-3 w-3 mr-1.5" />
                          )}
                          {submission.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground pt-2">
                        Submitted on{" "}
                        {new Date(submission.createdAt).toLocaleDateString(undefined, {
                          dateStyle: "long",
                        })}
                      </p>
                    </div>
                    {submission.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => deleteSubmission(submission.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
