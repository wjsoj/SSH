"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 transition-all duration-200"
    >
      <div
        className={`transition-all duration-200 ${copied ? "scale-0 opacity-0 absolute" : "scale-100 opacity-100"}`}
      >
        <Copy className="h-4 w-4" />
      </div>
      <div
        className={`transition-all duration-200 ${copied ? "scale-100 opacity-100" : "scale-0 opacity-0 absolute"}`}
      >
        <Check className="h-4 w-4 text-green-500" />
      </div>
      <span className="sr-only">Copy command</span>
    </Button>
  );
}
