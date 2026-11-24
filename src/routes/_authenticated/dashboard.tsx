import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ClipboardList, Flame, Gauge, ListChecks, RotateCcw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ShareButton } from "@/components/app/ShareButton";
import { SkillTable } from "@/components/app/SkillTable";
import { EmptyState, PageHeader, PageSkeleton, StatTile } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { appDataQuery, useAppData } from "@/lib/app-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(appDataQuery);
    if (!data.profile?.target_role_id) throw redirect({ to: "/onboarding" });
    return null;
  },
  pendingComponent: PageSkeleton,
  head: () => ({ meta: [{ title: "Dashboard — SkillBridge" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data, view } = useAppData();
  const firstName = (data.profile?.name || "there").split(" ")[0];

  if (!view.hasAssessment) {
    return (
      <>
        <PageHeader eyebrow={view.role?.name} title={`Welcome, ${firstName}`} />
        <EmptyState
          icon={<ClipboardList />}
          title="Take your 10-minute assessment"
          description="Answer two quick questions per skill and rate your familiarity. We'll calculate your Role Readiness Score and rank your skill gaps."
          action={
            <Button asChild size="lg">
              <Link to="/assessment">
                Start assessment <ArrowRight />
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  const chartData = view.ordered.map((s) => ({
    name: s.name.replace(" and fetch", "").replace("Responsive Design", "Responsive"),
    Level: Math.round(s.level * 100),
    Demand: s.weight * 10,
  }));
  const tick = { fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" };

  return (
    <>
      <PageHeader
        eyebrow={view.role?.name}
        title={`Welcome back, ${firstName}`}
        description={
          <>
            Last assessed{" "}
            <span className="num text-foreground">
              {new Date(view.lastAssessedAt!).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </>
        }
        action={
          <>
            {data.profile && <ShareButton username={data.profile.username} />}
            <Button asChild variant="outline">
              <Link to="/assessment">
                <RotateCcw /> Retake assessment
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Readiness" value={`${view.readiness}%`} hint="weighted by employer demand" icon={<Gauge className="size-4" />} />
        <StatTile label="Skills verified" value={`${view.verifiedCount}/${view.skills.length}`} hint="proven on GitHub" icon={<BadgeCheck className="size-4" />} />
        <StatTile label="Tasks done" value={`${view.doneCount}/${view.totalCount}`} hint="across your roadmap" icon={<ListChecks className="size-4" />} />
        <StatTile label="Weekly streak" value={`${view.streak} wk`} hint="weeks in a row with progress" icon={<Flame className="size-4" />} />
      </div>

      <section className="surface-card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Skills</h2>
          <code className="rounded-md border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">gap = weight × (1 − level)</code>
        </div>
        <SkillTable skills={view.skills} />
      </section>

      <section className="surface-card mt-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Your level vs employer demand</h2>
          <p className="text-xs text-muted-foreground">Level in %, demand weight scaled to 0–100</p>
        </div>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={tick} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={tick} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: 12, fontFamily: "var(--font-mono)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" iconSize={10} />
              <Bar dataKey="Level" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Demand" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link to="/roadmap" className="surface-card group flex items-center justify-between p-4 transition-colors hover:border-primary/40">
          <div>
            <p className="text-sm font-semibold">Continue your roadmap</p>
            <p className="text-sm text-muted-foreground">Next up: {view.ordered.find((s) => s.tasks.some((t) => t.userTask?.status !== "done"))?.name ?? "All done!"}</p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
        <Link to="/plan" className="surface-card group flex items-center justify-between p-4 transition-colors hover:border-primary/40">
          <div>
            <p className="text-sm font-semibold">{data.plan ? "View your weekly plan" : "Build a weekly plan"}</p>
            <p className="text-sm text-muted-foreground">
              {data.plan ? <><span className="num text-foreground">{data.plan.hours_per_week}</span> hours / week</> : "Fit tasks to the hours you have"}
            </p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      </div>
    </>
  );
}
