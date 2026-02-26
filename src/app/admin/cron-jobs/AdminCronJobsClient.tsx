"use client";

import { Clock, Loader2, MoreHorizontal, Play, Plus, ToggleLeft, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  repository: {
    id: string;
    owner: string;
    name: string;
    fullName: string;
  };
}

interface Repository {
  id: string;
  fullName: string;
}

const SCHEDULE_PRESETS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at 2 AM", value: "0 2 * * *" },
  { label: "Every day at 6 AM", value: "0 6 * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Weekly (Sunday)", value: "0 0 * * 0" },
];

export function AdminCronJobsClient() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const id = useId();
  const [formData, setFormData] = useState({
    name: "",
    repositoryId: "",
    schedule: "0 2 * * *",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCronJobs();
    fetchRepositories();
  }, []);

  async function fetchCronJobs() {
    try {
      const res = await fetch("/api/admin/cron-jobs");
      if (res.ok) {
        const data = await res.json();
        setCronJobs(data);
      }
    } catch (error) {
      console.error("Error fetching cron jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRepositories() {
    try {
      const res = await fetch("/api/admin/repositories");
      if (res.ok) {
        const data = await res.json();
        setRepositories(data);
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/cron-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: "", repositoryId: "", schedule: "0 2 * * *" });
        setShowForm(false);
        fetchCronJobs();
      }
    } catch (error) {
      console.error("Error creating cron job:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleEnabled(cronJob: CronJob) {
    try {
      const res = await fetch(`/api/admin/cron-jobs/${cronJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !cronJob.enabled }),
      });

      if (res.ok) {
        fetchCronJobs();
      }
    } catch (error) {
      console.error("Error toggling cron job:", error);
    }
  }

  async function deleteCronJob(cronJobId: string) {
    if (!confirm("Are you sure you want to delete this cron job?")) return;

    try {
      const res = await fetch(`/api/admin/cron-jobs/${cronJobId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCronJobs(cronJobs.filter((c) => c.id !== cronJobId));
      }
    } catch (error) {
      console.error("Error deleting cron job:", error);
    }
  }

  async function runNow(cronJobId: string) {
    try {
      const res = await fetch("/api/cron/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: cronJobs.find((c) => c.id === cronJobId)?.repository.id,
        }),
      });

      if (res.ok) {
        alert("Sync triggered successfully");
      }
    } catch (error) {
      console.error("Error running sync:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
            <Clock className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Cron Jobs</h1>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Cron Job
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Cron Job</DialogTitle>
              <DialogDescription>
                Set up automatic synchronization for a repository
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor={`${id}-name`}>Job Name</Label>
                <Input
                  id={`${id}-name`}
                  placeholder="Daily sync for vercel-labs/skills"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-repo`}>Repository</Label>
                <Select
                  value={formData.repositoryId}
                  onValueChange={(v) => setFormData({ ...formData, repositoryId: v })}
                >
                  <SelectTrigger id={`${id}-repo`}>
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id}>
                        {repo.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-schedule`}>Schedule</Label>
                <Select
                  value={formData.schedule}
                  onValueChange={(v) => setFormData({ ...formData, schedule: v })}
                >
                  <SelectTrigger id={`${id}-schedule`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground font-mono">{formData.schedule}</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Jobs</CardTitle>
          <CardDescription>Manage automatic repository synchronization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cronJobs.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No cron jobs configured yet
                    </TableCell>
                  </TableRow>
                ) : (
                  cronJobs.map((cronJob) => (
                    <TableRow key={cronJob.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{cronJob.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {cronJob.repository.fullName}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {cronJob.schedule}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={cronJob.enabled ? "default" : "secondary"}
                          className={
                            cronJob.enabled
                              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              : ""
                          }
                        >
                          {cronJob.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {cronJob.lastRunAt ? new Date(cronJob.lastRunAt).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {cronJob.enabled && cronJob.nextRunAt
                          ? new Date(cronJob.nextRunAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleEnabled(cronJob)}>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              {cronJob.enabled ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => runNow(cronJob.id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Run Now
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteCronJob(cronJob.id)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
