"use client";

import { Github } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Sign in to discover, share, and deploy scientific research skills.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => signIn("github")}>
            <Github className="mr-2 h-4 w-4" aria-hidden="true" />
            Continue with GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
