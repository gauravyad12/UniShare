"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast, toast } from "@/lib/mobile-aware-toast";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  title?: string;
  onCopy?: () => void;
  iconOnly?: boolean;
  children?: React.ReactNode;
}

export default function CopyButton({
  text,
  className,
  variant = "secondary",
  size = "sm",
  title = "Copy to clipboard",
  onCopy,
  iconOnly = true,
  children,
}: CopyButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);

    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });

    if (onCopy) {
      onCopy();
    }

    // Reset after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(className)}
      title={title}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : children ? (
        children
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {!iconOnly && <span className="ml-2">{copied ? "Copied" : "Copy"}</span>}
    </Button>
  );
}
