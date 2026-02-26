"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Critical error</h1>
            <p className="text-sm text-muted-foreground">
              The application encountered a fatal error. Please reload the page.
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground/60 mt-2">{error.digest}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Reload
            </Button>
            <Button variant="outline" asChild>
              <a href="/">
                <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                Go home
              </a>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
