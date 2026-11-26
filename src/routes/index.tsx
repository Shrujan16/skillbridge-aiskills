import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, BadgeCheck, CalendarRange, ClipboardCheck, Database, Github, Monitor, Radar, Route as RouteIcon, Server, Target } from "lucide-react";
import { Logo } from "@/components/app/Logo";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { Button } from "@/components/ui/button";
import { readinessPercent, skillGap } from "@/lib/skillbridge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillBridge — Know which skills employers want" },
      { name: "description", content: "A job-market-aware career roadmap for engineering students: assess your skills, see your gaps, plan your weeks and prove it with GitHub." },
      { property: "og:title", content: "SkillBridge — Know which skills employers want" },
      { property: "og:description", content: "Assess, match, plan and prove your way to your first engineering role." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Radar,
    title: "Market-Match",
    body: "Skills weighted by how often entry-level postings ask for them, so you work on what actually gets you hired.",
  },
  {
    icon: CalendarRange,
    title: "Weekly Planner",
    body: "Tell us your hours and deadline. We fill each week with the right tasks and re-balance when life happens.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Proof",
    body: "Link a GitHub project per skill. We check it's really yours and turn it into a shareable verified badge.",
  },
];

const STEPS = [
  { icon: ClipboardCheck, label: "Assess", text: "A 10-minute quiz and self-rating per skill." },
  { icon: Target, label: "Match", text: "See your Role Readiness Score and ranked gaps." },
  { icon: RouteIcon, label: "Plan", text: "A roadmap and week-by-week plan with resources." },
  { icon: Github, label: "Prove", text: "Verified projects on a public skill profile." },
];

const TECH = ["React", "Vite", "Tailwind CSS", "Supabase", "PostgreSQL", "GitHub API"];

const ARCH = [
  { icon: Monitor, title: "Client", detail: "React + Vite" },
  { icon: Server, title: "Edge Functions", detail: "Server logic" },
  { icon: Database, title: "Supabase", detail: "Auth, PostgreSQL" },
  { icon: Github, title: "GitHub API", detail: "Repo verification" },
];

// Worked example — values come from the same scoring functions the app uses.
const EXAMPLE = [
  { skill: "HTML", weight: 6, level: 0.9 },
  { skill: "JavaScript", weight: 9, level: 0.55 },
  { skill: "React", weight: 8, level: 0.3 },
];
const EXAMPLE_READINESS = readinessPercent(EXAMPLE);
const EXAMPLE_WEIGHT_SUM = EXAMPLE.reduce((s, r) => s + r.weight, 0);
const EXAMPLE_SCORE_SUM = Math.round(EXAMPLE.reduce((s, r) => s + r.weight * r.level, 0) * 100) / 100;

function HeroVisual() {
  const bars = [
    { name: "HTML", level: 90 },
    { name: "CSS", level: 82 },
    { name: "JavaScript", level: 55 },
    { name: "React", level: 30 },
    { name: "Accessibility", level: 20 },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md animate-rise [animation-delay:120ms]">
      <div className="surface-card overflow-hidden shadow-lift">
        <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-2 font-mono text-[11px] text-muted-foreground">skillbridge / dashboard</span>
          <span className="ml-auto rounded border border-dashed px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Sample preview</span>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Front-End Developer</p>
              <p className="mt-1 text-lg font-semibold">Role readiness</p>
            </div>
            <div className="grid size-20 place-items-center rounded-full bg-[conic-gradient(var(--primary)_0_61%,var(--muted)_61%_100%)]">
              <div className="num grid size-16 place-items-center rounded-full bg-card text-lg font-semibold">61%</div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {bars.map((b) => (
              <div key={b.name}>
                <div className="mb-1 flex justify-between text-xs font-medium">
                  <span>{b.name}</span>
                  <span className="num text-muted-foreground">{b.level}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${b.level}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="surface-card absolute -bottom-5 -left-4 flex items-center gap-2 px-3 py-2 text-sm font-medium shadow-lift sm:-left-8">
        <BadgeCheck className="size-4 text-success" /> CSS verified on GitHub <span className="text-[10px] font-normal text-muted-foreground">(example)</span>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-6 max-w-2xl">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 text-muted-foreground">{description}</p>}
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-hero border-b">
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-md border bg-card px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground shadow-card">
              <span className="size-1.5 rounded-full bg-accent" /> For engineering students
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[56px]">
              Know which skills employers want, <span className="text-brand">how far you are</span>, and prove it.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              SkillBridge turns real job postings into a personal roadmap — from your first quiz to a verified public skill profile.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth" search={{ demo: true }}>Try the demo</Link>
              </Button>
            </div>
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="Built with">
              {TECH.map((t) => (
                <li key={t} className="rounded-md border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground shadow-card">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-3 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article key={f.title} className="surface-card animate-rise p-5" style={{ animationDelay: `${200 + i * 80}ms` }}>
              <div className="grid size-9 place-items-center rounded-md border bg-primary-soft text-primary">
                <f.icon className="size-4" />
              </div>
              <h2 className="mt-4 text-base font-semibold">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionTitle
            eyebrow="How the score works"
            title="Two formulas, no black box"
            description="Each skill has a demand weight from 1 to 10 (how often entry-level postings ask for it) and your level from 0 to 1."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <pre className="overflow-x-auto rounded-lg border bg-muted/70 p-4 font-mono text-sm leading-relaxed">
                <code>
                  <span className="text-muted-foreground">{"// Role Readiness Score"}</span>
                  {"\n"}
                  <span className="text-primary">Readiness %</span>
                  {" = 100 x SUM(weight x level) / SUM(weight)"}
                </code>
              </pre>
              <pre className="overflow-x-auto rounded-lg border bg-muted/70 p-4 font-mono text-sm leading-relaxed">
                <code>
                  <span className="text-muted-foreground">{"// Gap per skill — biggest gaps first"}</span>
                  {"\n"}
                  <span className="text-primary">Gap</span>
                  {" = weight x (1 - level)"}
                </code>
              </pre>
            </div>
            <div className="surface-card overflow-hidden">
              <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Worked example</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th scope="col" className="px-4 py-2 font-medium">Skill</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">Weight</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">Level</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">w x l</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">Gap</th>
                    </tr>
                  </thead>
                  <tbody className="num divide-y">
                    {EXAMPLE.map((r) => (
                      <tr key={r.skill}>
                        <th scope="row" className="px-4 py-2 text-left font-sans font-medium">{r.skill}</th>
                        <td className="px-4 py-2 text-right">{r.weight}</td>
                        <td className="px-4 py-2 text-right">{r.level.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{(r.weight * r.level).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-semibold">{skillGap(r.weight, r.level).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="num border-t bg-muted/50 px-4 py-3 text-xs">
                100 x {EXAMPLE_SCORE_SUM} / {EXAMPLE_WEIGHT_SUM} = <span className="text-sm font-semibold text-primary">{EXAMPLE_READINESS}%</span>
                <span className="font-sans text-muted-foreground"> ready — React has the biggest gap, so it comes first.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle eyebrow="Architecture" title="How the pieces connect" />
        <ol className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
          {ARCH.map((a, i) => (
            <li key={a.title} className="contents">
              <div className="surface-card flex flex-1 items-center gap-3 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-foreground">
                  <a.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{a.detail}</p>
                </div>
              </div>
              {i < ARCH.length - 1 && (
                <span className="flex justify-center text-muted-foreground" aria-hidden="true">
                  <ArrowRight className="hidden size-4 md:block" />
                  <ArrowDown className="size-4 md:hidden" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="rounded-lg border bg-primary p-8 text-primary-foreground shadow-lift sm:p-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">Assess. Match. Plan. Prove.</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.label}>
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <span className="font-mono">0{i + 1}</span>
                  <s.icon className="size-4" />
                </div>
                <p className="mt-2 text-lg font-semibold">{s.label}</p>
                <p className="mt-1 text-sm opacity-80">{s.text}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="accent" size="lg" className="mt-10">
            <Link to="/auth" search={{ mode: "signup" }}>
              Start your roadmap <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        SkillBridge · Built for students taking their first step into tech
      </footer>
    </div>
  );
}
