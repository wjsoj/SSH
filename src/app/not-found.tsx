import { Home } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="text-8xl font-bold text-muted-foreground/20 select-none">404</div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Go home
            </Link>
          </Button>
          <BackButton />
        </div>
      </div>
    </div>
  );
}
