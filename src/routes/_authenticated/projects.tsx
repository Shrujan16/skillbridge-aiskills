import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, CircleAlert, CircleCheck, CircleX, Clock, Github, Loader2, RefreshCw } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader, PageSkeleton } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { appDataQuery, useAppData, type SkillView } from "@/lib/app-data";
import { verifyRepo } from "@/lib/github.functions";

export const Route = createFileRoute("/_authenticated/projects")({
  loader: ({ context }) => context.queryClient.ensureQueryData(appDataQuery),
  pendingComponent: PageSkeleton,
  head: () => ({ meta: [{ title: "Projects & proof — SkillBridge" }] }),
  component: Projects,
});

function GithubUsernameCard({ userId, current }: { userId: string; current: string | null }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(current ?? "");
  const [editing, setEditing] = useState(!current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    const v = value.trim().replace(/^@/, "");
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(v)) return setError("That doesn't look like a GitHub username.");
    setError("");
    setBusy(true);
    const { error: err } = await supabase.from("profiles").update({ github_username: v }).eq("id", userId);
    setBusy(false);
    if (err) return toast.error("Couldn't save your username.");
    await queryClient.invalidateQueries({ queryKey: appDataQuery.queryKey });
    toast.success("GitHub username saved");
    setEditing(false);
  }

  if (!editing && current) {
    return (
      <div className="surface-card mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
            <Github className="size-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Connected GitHub username</p>
            <p className="font-semibold">@{current}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={save} noValidate className="surface-card mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="gh">Your GitHub username</Label>
        <Input id="gh" value={value} onChange={(e) => setValue(e.target.value)} placeholder="octocat" autoComplete="off" />
        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : <p className="text-xs text-muted-foreground">We use it to check that projects are really yours.</p>}
      </div>
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />} Save
      </Button>
    </form>
  );
}

function ProjectCard({ skill, hasUsername }: { skill: SkillView; hasUsername: boolean }) {
  const queryClient = useQueryClient();
  const verify = useServerFn(verifyRepo);
  const v = skill.verification;
  const [url, setUrl] = useState(v?.repo_url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rateLimit, setRateLimit] = useState<string | null | undefined>(undefined);

  async function check(force = false) {
    setError("");
    setRateLimit(undefined);
    if (!url.trim()) return setError("Paste your repository link first.");
    setBusy(true);
    try {
      const res = await verify({ data: { skillId: skill.id, repoUrl: url.trim(), force } });
      if (res.kind === "error") setError(res.message);
      else if (res.kind === "rate_limited") setRateLimit(res.retryAt);
      else {
        await queryClient.invalidateQueries({ queryKey: appDataQuery.queryKey });
        if (res.status === "verified") toast.success(`${skill.name} verified!`);
        else toast.warning("Needs review — see which checks failed.");
      }
    } catch {
      setError("Something went wrong while checking. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const checks = v?.details.checks ?? [];

  return (
    <article className="surface-card flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{skill.name}</p>
          <h2 className="mt-1 text-lg font-bold">{skill.project?.title}</h2>
        </div>
        {v?.status === "verified" ? (
          <Badge variant="success" className="gap-1">
            <BadgeCheck className="size-3.5" /> Verified
          </Badge>
        ) : v?.status === "needs_review" ? (
          <Badge variant="warning" className="gap-1">
            <CircleAlert className="size-3.5" /> Needs review
          </Badge>
        ) : (
          <Badge variant="secondary">Not submitted</Badge>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{skill.project?.description}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3.5" /> about {skill.project?.est_hours} h
      </p>

      {checks.length > 0 && (
        <ul className="mt-4 space-y-1.5 rounded-xl bg-muted p-3 text-sm">
          {checks.map((c) => (
            <li key={c.key} className="flex items-start gap-2">
              {c.passed ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-accent" /> : <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />}
              <span>
                {c.label}
                {!c.passed && c.message && <span className="block text-xs text-muted-foreground">{c.message}</span>}
              </span>
            </li>
          ))}
          {v && (
            <li className="pt-1 text-xs text-muted-foreground">
              Checked {new Date(v.checked_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              {v.details.sample && " · sample data"}
            </li>
          )}
        </ul>
      )}

      <div className="mt-auto pt-4">
        <Label htmlFor={`repo-${skill.id}`} className="text-xs">
          Repository link
        </Label>
        <div className="mt-1.5 flex gap-2">
          <Input id={`repo-${skill.id}`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/you/project" disabled={!hasUsername} />
          <Button onClick={() => check(v?.repo_url === url.trim())} disabled={busy || !hasUsername}>
            {busy ? <Loader2 className="animate-spin" /> : v ? <RefreshCw /> : <Github />}
            <span className="hidden sm:inline">{v ? "Re-check" : "Verify"}</span>
          </Button>
        </div>
        {error && <p className="mt-2 text-xs font-medium text-destructive" role="alert">{error}</p>}
        {rateLimit !== undefined && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-warning-soft p-2.5 text-xs text-warning-foreground" role="alert">
            <span>
              GitHub is limiting requests right now.
              {rateLimit ? ` Try again after ${new Date(rateLimit).toLocaleTimeString(undefined, { timeStyle: "short" })}.` : " Please try again in a few minutes."}
            </span>
            <Button size="sm" variant="outline" onClick={() => check(true)} disabled={busy}>
              Retry
            </Button>
          </div>
        )}
        {!hasUsername && <p className="mt-2 text-xs text-muted-foreground">Add your GitHub username above to verify.</p>}
      </div>
    </article>
  );
}

function Projects() {
  const { data, view } = useAppData();
  return (
    <>
      <PageHeader
        eyebrow="Proof of skill"
        title="Projects"
        description="One small project per skill. Link the GitHub repo and we'll check it's public, yours, has your commits, a README and the right language."
      />
      <GithubUsernameCard userId={data.user.id} current={data.profile?.github_username ?? null} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {view.ordered.map((s) => (
          <ProjectCard key={s.id} skill={s} hasUsername={Boolean(data.profile?.github_username)} />
        ))}
      </div>
    </>
  );
}
