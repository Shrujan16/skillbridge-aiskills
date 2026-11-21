import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BadgeCheck, ExternalLink, Github } from "lucide-react";
import { Logo } from "@/components/app/Logo";
import { Button } from "@/components/ui/button";
import { getPublicProfile } from "@/lib/public-profile.functions";

export const Route = createFileRoute("/u/$username")({
  loader: async ({ params }) => {
    const profile = await getPublicProfile({ data: { username: params.username } });
    if (!profile) throw notFound();
    return { profile };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const title = p ? `${p.name} — ${p.role ?? "Student"} skill profile · SkillBridge` : "Skill profile · SkillBridge";
    const description = p
      ? `${p.name} is ${p.readiness ?? 0}% ready for ${p.role ?? "their target role"} with ${p.verified.length} GitHub-verified skill${p.verified.length === 1 ? "" : "s"}.`
      : "A verified skill profile on SkillBridge.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-hero px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold">Profile not found</h1>
        <p className="mt-2 text-muted-foreground">This share link doesn't match any SkillBridge profile.</p>
        <Button asChild className="mt-6">
          <Link to="/">Go to SkillBridge</Link>
        </Button>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center bg-hero px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">We couldn't load this profile</h1>
        <p className="mt-2 text-muted-foreground">Please refresh in a moment.</p>
      </div>
    </div>
  ),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { profile } = Route.useLoaderData();
  const initials = profile.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const readiness = profile.readiness ?? 0;

  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <Logo />
        <Button asChild size="sm" variant="outline">
          <Link to="/auth" search={{ mode: "signup" }}>Create yours</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-6">
        <section className="surface-card overflow-hidden">
          <div className="h-24 bg-brand" />
          <div className="px-6">
            <div className="-mt-10 grid size-20 place-items-center rounded-2xl border-4 border-card bg-primary font-display text-2xl font-bold text-primary-foreground shadow-card">
              {initials}
            </div>
          </div>
          <div className="flex flex-col gap-5 px-6 pb-6 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-end gap-4">
              <div>
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <p className="text-sm text-muted-foreground">{profile.role ?? "Engineering student"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid size-20 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) 0 ${readiness}%, var(--primary-soft) ${readiness}% 100%)` }}>
                <div className="grid size-16 place-items-center rounded-full bg-card text-center">
                  <span className="font-display text-lg font-bold leading-none">{profile.readiness === null ? "—" : `${readiness}%`}</span>
                </div>
              </div>
              <div className="text-sm">
                <p className="font-semibold">Role readiness</p>
                {profile.github_username && (
                  <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Github className="size-3.5" /> @{profile.github_username}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold">Verified skills</h2>
          {profile.verified.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted-foreground">No verified skills yet — check back soon.</div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {profile.verified.map((v) => (
                  <span key={v.skill} className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-sm font-semibold text-accent">
                    <BadgeCheck className="size-4" /> {v.skill}
                  </span>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.verified.map((v) => (
                  <a key={v.skill} href={v.repo_url} target="_blank" rel="noreferrer" className="surface-card group block p-4 transition-shadow hover:shadow-lift">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">{v.skill}</p>
                    <p className="mt-1 font-semibold">{v.project ?? "Project"}</p>
                    <p className="mt-2 inline-flex items-center gap-1 truncate text-xs text-muted-foreground group-hover:text-primary">
                      <Github className="size-3.5" /> {v.repo_url.replace("https://github.com/", "")} <ExternalLink className="size-3" />
                    </p>
                  </a>
                ))}
              </div>
            </>
          )}
        </section>
        <p className="mt-10 text-center text-xs text-muted-foreground">Skills verified against public GitHub repositories by SkillBridge.</p>
      </main>
    </div>
  );
}
