"use client";

import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Repository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  skillsFolder: string;
  sourceType: string;
  isEnabled: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  _count: {
    skills: number;
  };
}

export default function AdminRepositoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const id = useId();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
    description: "",
    skillsFolder: "skills",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchRepositories();
    }
  }, [status, router]);

  const fetchRepositories = async () => {
    try {
      const res = await fetch("/api/admin/repositories");
      if (res.ok) {
        const data = await res.json();
        setRepositories(data);
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ url: "", description: "", skillsFolder: "skills" });
        setShowForm(false);
        fetchRepositories();
      }
    } catch (error) {
      console.error("Error creating repository:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async (repoId: string) => {
    setSyncing(repoId);
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: repoId }),
      });

      if (res.ok) {
        fetchRepositories();
      }
    } catch (error) {
      console.error("Error syncing repository:", error);
    } finally {
      setSyncing(null);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Repositories</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Repository
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Repository</CardTitle>
            <CardDescription>
              Enter the URL of a GitHub repository containing skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor={`${id}-url`}>Repository URL</Label>
                <Input
                  id={`${id}-url`}
                  placeholder="https://github.com/wjsoj/repo"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`${id}-description`}>Description (optional)</Label>
                <Input
                  id={`${id}-description`}
                  placeholder="Repository description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`${id}-skillsFolder`}>Skills Folder</Label>
                <Input
                  id={`${id}-skillsFolder`}
                  placeholder="skills"
                  value={formData.skillsFolder}
                  onChange={(e) => setFormData({ ...formData, skillsFolder: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {repositories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No repositories added yet.</p>
            </CardContent>
          </Card>
        ) : (
          repositories.map((repo) => (
            <Card key={repo.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{repo.fullName}</CardTitle>
                  <CardDescription className="mt-1">
                    {repo.description || "No description"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={repo.isEnabled ? "default" : "secondary"}>
                    {repo.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Badge variant="outline">{repo._count.skills} skills</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>Folder: {repo.skillsFolder}</span>
                  <span>|</span>
                  <span>
                    Last synced:{" "}
                    {repo.lastSyncedAt ? new Date(repo.lastSyncedAt).toLocaleString() : "Never"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(repo.id)}
                    disabled={syncing === repo.id}
                  >
                    {syncing === repo.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
