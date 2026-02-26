"use client";

import { Cog, RefreshCw, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Settings {
  syncInterval: string;
  syncEnabled: string;
  defaultSkillsFolder: string;
  allowPublicRegistration: string;
  maintenanceMode: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    syncInterval: "daily",
    syncEnabled: "true",
    defaultSkillsFolder: "skills",
    allowPublicRegistration: "true",
    maintenanceMode: "false",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(key: string, value: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (res.ok) {
        setSettings({ ...settings, [key]: value });
        console.log("Setting updated");
      } else {
        console.error("Failed to update setting");
      }
    } catch (error) {
      console.error("Error updating setting:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-gray-500/10 text-gray-500">
            <Settings className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        </div>
        <p className="text-muted-foreground animate-pulse">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-gray-500/10 text-gray-500">
          <Settings className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
      </div>

      <div className="grid gap-8 max-w-3xl">
        <Card className="">
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>Configure automatic repository synchronization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-1">
                <Label className="text-base">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync repositories on schedule
                </p>
              </div>
              <Switch
                checked={settings.syncEnabled === "true"}
                onCheckedChange={(checked) => updateSetting("syncEnabled", checked.toString())}
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label>Sync Interval</Label>
              <Select
                value={settings.syncInterval}
                onValueChange={(value) => updateSetting("syncInterval", value)}
                disabled={saving || settings.syncEnabled !== "true"}
              >
                <SelectTrigger className="">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Skills Folder</Label>
              <Input
                value={settings.defaultSkillsFolder}
                onChange={(e) => setSettings({ ...settings, defaultSkillsFolder: e.target.value })}
                onBlur={(e) => updateSetting("defaultSkillsFolder", e.target.value)}
                placeholder="skills"
                className=""
              />
              <p className="text-sm text-muted-foreground">
                Default folder name to look for skills in repositories
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle>Site Settings</CardTitle>
            <CardDescription>General site configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-1">
                <Label className="text-base">Allow Public Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to sign up via GitHub OAuth
                </p>
              </div>
              <Switch
                checked={settings.allowPublicRegistration === "true"}
                onCheckedChange={(checked) =>
                  updateSetting("allowPublicRegistration", checked.toString())
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-1">
                <Label className="text-base">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Show maintenance page to non-admin users
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode === "true"}
                onCheckedChange={(checked) => updateSetting("maintenanceMode", checked.toString())}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle>Manual Actions</CardTitle>
            <CardDescription>Run manual operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" asChild className="">
                <a href="/admin/repositories">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Repositories
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
