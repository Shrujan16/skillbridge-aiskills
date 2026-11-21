import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, CalendarRange, ClipboardCheck, Github, Radar, Route as RouteIcon, Target } from "lucide-react";
import { Logo } from "@/components/app/Logo";
import { Button } from "@/components/ui/button";

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
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-brand opacity-20 blur-3xl" aria-hidden="true" />
      <div className="surface-card p-5 shadow-lift">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Front-End Developer</p>
            <p className="font-display text-xl font-bold">Readiness</p>
          </div>
          <div className="grid size-20 place-items-center rounded-full bg-[conic-gradient(var(--primary)_0_61%,var(--primary-soft)_61%_100%)]">
            <div className="grid size-16 place-items-center rounded-full bg-card font-display text-lg font-bold">61%</div>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {bars.map((b) => (
            <div key={b.name}>
              <div className="mb-1 flex justify-between text-xs font-medium">
                <span>{b.name}</span>
                <span className="text-muted-foreground">{b.level}%</span>
              </div>
              <div className="h-2 rounded-full bg-primary-soft">
                <div className="h-2 rounded-full bg-brand" style={{ width: `${b.level}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="surface-card absolute -bottom-6 -left-4 flex items-center gap-2 px-3 py-2 text-sm font-semibold shadow-lift sm:-left-10">
        <BadgeCheck className="size-5 text-accent" /> CSS verified on GitHub
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-accent shadow-card">
            <span className="size-1.5 rounded-full bg-accent" /> For engineering students
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
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
        </div>
        <HeroVisual />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article key={f.title} className="surface-card animate-rise p-6" style={{ animationDelay: `${200 + i * 80}ms` }}>
              <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-bold">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="rounded-3xl bg-primary p-8 text-primary-foreground shadow-lift sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">Assess. Match. Plan. Prove.</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.label}>
                <div className="flex items-center gap-2 text-sm font-semibold opacity-80">
                  <span className="font-display">0{i + 1}</span>
                  <s.icon className="size-4" />
                </div>
                <p className="mt-2 font-display text-lg font-bold">{s.label}</p>
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
