import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ExternalLink, FileDown, Flame, ListChecks, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ShareButton } from "@/components/app/ShareButton";
import { PageHeader, PageSkeleton, StatTile } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { appDataQuery, useAppData } from "@/lib/app-data";

export const Route = createFileRoute("/_authenticated/profile")({
  loader: ({ context }) => context.queryClient.ensureQueryData(appDataQuery),
  pendingComponent: PageSkeleton,
  head: () => ({ meta: [{ title: "Profile — SkillBridge" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data, view } = useAppData();
  const queryClient = useQueryClient();
  const profile = data.profile;
  const [name, setName] = useState(profile?.name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [github, setGithub] = useState(profile?.github_username ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next["name"] = "Enter your name";
    if (!/^[a-z0-9-]{3,30}$/.test(username.trim())) next["username"] = "3–30 characters: lowercase letters, numbers and dashes";
    const gh = github.trim().replace(/^@/, "");
    if (gh && !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(gh)) next["github"] = "That doesn't look like a GitHub username";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), username: username.trim(), github_username: gh || null })
      .eq("id", data.user.id);
    setBusy(false);
    if (error) {
      if (error.code === "23505") setErrors({ username: "That profile link is taken — try another." });
      else toast.error("Couldn't save your profile.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: appDataQuery.queryKey });
    toast.success("Profile saved");
  }

  if (!profile) return null;

  return (
    <>
      <PageHeader title="Profile" description={data.user.email} action={<><Button asChild variant="outline" className="min-h-11"><Link to="/report"><FileDown /> Download skill report</Link></Button><ShareButton username={profile.username} /></>} />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={save} noValidate className="surface-card space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-bold">Your details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            {errors["name"] && <p className="text-xs font-medium text-destructive">{errors["name"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Public profile link</Label>
            <div className="flex items-center rounded-md border border-input bg-card pl-3 text-sm focus-within:ring-1 focus-within:ring-ring">
              <span className="text-muted-foreground">/u/</span>
              <input id="username" className="h-9 flex-1 bg-transparent px-1 outline-none" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
            </div>
            {errors["username"] && <p className="text-xs font-medium text-destructive">{errors["username"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="github">GitHub username</Label>
            <Input id="github" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="octocat" />
            {errors["github"] && <p className="text-xs font-medium text-destructive">{errors["github"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Target role</Label>
            <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2 text-sm">
              {view.role?.name ?? "Not chosen"}
              <Link to="/onboarding" className="text-xs font-semibold text-primary hover:underline">
                Change
              </Link>
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Save changes
          </Button>
        </form>

        <div className="space-y-4">
          <section className="surface-card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Progress summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatTile label="Readiness" value={view.hasAssessment ? `${view.readiness}%` : "—"} />
              <StatTile label="Tasks" value={`${view.doneCount}/${view.totalCount}`} icon={<ListChecks className="size-4" />} />
              <StatTile label="Streak" value={`${view.streak} wk`} icon={<Flame className="size-4" />} />
              <StatTile label="Verified" value={view.verifiedCount} icon={<BadgeCheck className="size-4" />} />
            </div>
            <div className="mt-4 space-y-2">
              {view.ordered.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 truncate">{s.name}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-primary-soft">
                    <div className="h-1.5 rounded-full bg-brand" style={{ width: `${Math.round(s.level * 100)}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground">{Math.round(s.level * 100)}%</span>
                </div>
              ))}
            </div>
          </section>
          <Link to="/u/$username" params={{ username: profile.username }} className="surface-card flex items-center justify-between p-4 text-sm font-semibold text-primary hover:shadow-lift">
            View your public profile <ExternalLink className="size-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
