import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { shareUrl } from "@/lib/app-data";

export function ShareButton({ username, variant = "outline" }: { username: string; variant?: ButtonProps["variant"] }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const url = shareUrl(username);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Share link copied", { description: url });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.message("Copy this link", { description: url });
    }
  }
  return (
    <Button variant={variant} onClick={copy}>
      {copied ? <Check /> : <Link2 />} Copy share link
    </Button>
  );
}
