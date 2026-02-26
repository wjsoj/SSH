"use client";

import { Check, CheckCircle, Clock, ExternalLink, Loader2, Star, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface SyncProgress {
  status: "scanning" | "processing" | "saving" | "complete" | "error";
  message: string;
  currentPath?: string;
  skillsFound?: number;
}

interface Submission {
  id: string;
  url: string;
  owner: string;
  name: string;
  skillsFolder: string;
  status: string;
  createdAt: string;
  submittedBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

export function AdminSubmissionsClient() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [syncingProgress, setSyncingProgress] = useState<SyncProgress | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchSubmissions();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  async function fetchSubmissions() {
    try {
      const res = await fetch("/api/admin/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!selectedSubmission) return;
    const submissionId = selectedSubmission.id;
    setProcessing(true);
    setSyncingProgress({ status: "scanning", message: "Starting sync..." });

    setSelectedSubmission(null);
    setReviewNote("");

    try {
      const res = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action: "approve", reviewNote }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Approve failed:", data.error);
        setProcessing(false);
        setSyncingProgress({ status: "error", message: data.error || "Failed to approve" });
        setTimeout(() => setSyncingProgress(null), 3000);
        return;
      }
    } catch (error) {
      console.error("Error approving:", error);
      setProcessing(false);
      setSyncingProgress({ status: "error", message: "Network error" });
      setTimeout(() => setSyncingProgress(null), 3000);
      return;
    }

    const eventSource = new EventSource(`/api/admin/sync/progress?submissionId=${submissionId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const progress = JSON.parse(event.data) as SyncProgress;
      setSyncingProgress(progress);

      if (progress.status === "complete" || progress.status === "error") {
        eventSource.close();
        setProcessing(false);
        setTimeout(() => setSyncingProgress(null), 2000);
        fetchSubmissions();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setProcessing(false);
      setSyncingProgress({ status: "error", message: "Connection error" });
      setTimeout(() => setSyncingProgress(null), 3000);
      fetchSubmissions();
    };
  }

  async function handleReject() {
    if (!selectedSubmission) return;
    setProcessing(true);

    try {
      const res = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          action: "reject",
          reviewNote,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSelectedSubmission(null);
        setReviewNote("");
        fetchSubmissions();
      } else {
        console.error("Reject failed:", data.error);
      }
    } catch (error) {
      console.error("Error rejecting submission:", error);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Submission Review</h1>
            <p className="text-muted-foreground">Review community contributions</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <Badge variant="default" className="text-lg px-4 py-1 bg-primary text-primary-foreground">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>Manage user-submitted skill repositories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Repository</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No submissions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => (
                    <TableRow key={submission.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <a
                          href={submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-primary transition-colors flex items-center gap-1"
                        >
                          {submission.owner}/{submission.name}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      </TableCell>
                      <TableCell>
                        {submission.submittedBy && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={submission.submittedBy.image || ""} />
                              <AvatarFallback>
                                {submission.submittedBy.name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{submission.submittedBy.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {submission.skillsFolder}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            submission.status === "PENDING"
                              ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              : submission.status === "APPROVED"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                          }
                        >
                          {submission.status === "PENDING" && <Clock className="h-3 w-3 mr-1" />}
                          {submission.status === "APPROVED" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {submission.status === "REJECTED" && <XCircle className="h-3 w-3 mr-1" />}
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {submission.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>Review and approve or reject this submission</DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Repository</Label>
                <p className="font-medium text-lg">
                  <a
                    href={selectedSubmission.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    {selectedSubmission.owner}/{selectedSubmission.name}
                    <ExternalLink className="h-4 w-4 opacity-50" />
                  </a>
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Skills Folder</Label>
                <div className="p-2 rounded font-mono text-sm border w-fit">
                  {selectedSubmission.skillsFolder}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Review Note (optional)</Label>
                <Textarea
                  placeholder="Add a note about this submission..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSubmission(null);
                setReviewNote("");
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </>
              )}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="bg-primary hover:bg-primary/90"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!syncingProgress}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Syncing Repository</DialogTitle>
            <DialogDescription>Fetching skills from GitHub</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              {syncingProgress?.status === "complete" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : syncingProgress?.status === "error" ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              <span className="font-medium">{syncingProgress?.message}</span>
            </div>

            {syncingProgress?.currentPath && (
              <p className="text-sm text-muted-foreground font-mono">
                {syncingProgress.currentPath}
              </p>
            )}

            {syncingProgress?.skillsFound !== undefined && (
              <div className="text-sm text-muted-foreground">
                Skills found: {syncingProgress.skillsFound}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
