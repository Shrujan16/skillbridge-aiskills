import { CheckCircle2, Loader2, MessageSquarePlus, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const HELPFUL = [
  { value: "yes", label: "Yes" },
  { value: "somewhat", label: "Somewhat" },
  { value: "no", label: "No" },
] as const;

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [helpful, setHelpful] = useState<string>("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function reset(next: boolean) {
    setOpen(next);
    if (!next) setTimeout(() => { setRating(0); setHelpful(""); setComment(""); setError(""); setDone(false); }, 200);
  }

  async function submit() {
    if (!rating) return setError("Pick a rating from 1 to 5.");
    if (!helpful) return setError("Tell us if it helped.");
    setError("");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: err } = await supabase.from("feedback").insert({
      user_id: user?.id ?? "",
      rating,
      helpful,
      comment: comment.trim() ? comment.trim().slice(0, 1000) : null,
    });
    setBusy(false);
    if (err) return setError("Couldn't send your feedback. Please try again.");
    setDone(true);
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9" aria-label="Give feedback">
          <MessageSquarePlus /> <span className="hidden sm:inline">Give feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="grid place-items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <DialogTitle>Thank you!</DialogTitle>
            <DialogDescription>Your feedback helps us make SkillBridge better.</DialogDescription>
            <Button onClick={() => reset(false)} className="mt-2 min-h-11">Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Give feedback</DialogTitle>
              <DialogDescription>Takes 20 seconds.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Overall rating</Label>
                <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      onClick={() => setRating(n)} className="grid size-11 place-items-center rounded-md hover:bg-muted">
                      <Star className={cn("size-6", n <= rating ? "fill-warning text-warning" : "text-muted-foreground")} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Did this help you understand which skills to learn?</Label>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Did it help">
                  {HELPFUL.map((h) => (
                    <Button key={h.value} type="button" role="radio" aria-checked={helpful === h.value}
                      variant={helpful === h.value ? "default" : "outline"} className="min-h-11" onClick={() => setHelpful(h.value)}>
                      {h.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb-comment">Comment (optional)</Label>
                <Textarea id="fb-comment" value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} placeholder="What would make it more useful?" />
              </div>
              {error && <p className="text-sm font-medium text-destructive" role="alert">{error}</p>}
              <Button onClick={submit} disabled={busy} className="min-h-11 w-full">
                {busy && <Loader2 className="animate-spin" />} Send feedback
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
