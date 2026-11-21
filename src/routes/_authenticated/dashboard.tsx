import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ClipboardList, Flame, ListChecks, RotateCcw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ReadinessRing } from "@/components/app/ReadinessRing";
import { ShareButton } from "@/components/app/ShareButton";
import { StatusBadge } from "@/components/app/StatusBadge";
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
        <PageHeader eyebrow={view.role?.name} title={`Hi ${firstName} 👋`} />
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

  return (
    <>
      <PageHeader
        eyebrow={view.role?.name}
        title={`Hi ${firstName} 👋`}
        description={`Last assessed ${new Date(view.lastAssessedAt!).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}
        action={
          <>
            {data.profile && <ShareButton username={data.profile.username} />}
            <Button asChild variant="soft">
              <Link to="/assessment">
                <RotateCcw /> Retake assessment
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="surface-card flex flex-col items-center gap-5 p-6 sm:flex-row lg:flex-col xl:flex-row">
          <ReadinessRing value={view.readiness} />
          <div className="grid w-full flex-1 grid-cols-2 gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
            <StatTile label="Tasks done" value={`${view.doneCount}/${view.totalCount}`} icon={<ListChecks className="size-4" />} />
            <StatTile label="Weekly streak" value={`${view.streak} wk`} icon={<Flame className="size-4" />} />
            <StatTile label="Verified" value={view.verifiedCount} hint="skills proven on GitHub" icon={<BadgeCheck className="size-4" />} />
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Biggest skill gaps</h2>
            <span className="text-xs text-muted-foreground">Gap = demand × (1 − level)</span>
          </div>
          <ol className="space-y-2.5">
            {view.byGap.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-muted">
                <span className="w-5 text-center font-display text-sm font-bold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{s.name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-primary-soft">
                    <div className="h-1.5 rounded-full bg-brand" style={{ width: `${Math.round(s.level * 100)}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-sm font-bold">{s.gap.toFixed(1)}</div>
                  <div className="text-[11px] text-muted-foreground">gap</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="surface-card mt-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Your level vs employer demand</h2>
        <p className="text-sm text-muted-foreground">Level in %, demand weight scaled to 0–100.</p>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Level" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Demand" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link to="/roadmap" className="surface-card group flex items-center justify-between p-5 transition-shadow hover:shadow-lift">
          <div>
            <p className="font-semibold">Continue your roadmap</p>
            <p className="text-sm text-muted-foreground">Next up: {view.ordered.find((s) => s.tasks.some((t) => t.userTask?.status !== "done"))?.name ?? "All done!"}</p>
          </div>
          <ArrowRight className="text-primary transition-transform group-hover:translate-x-1" />
        </Link>
        <Link to="/plan" className="surface-card group flex items-center justify-between p-5 transition-shadow hover:shadow-lift">
          <div>
            <p className="font-semibold">{data.plan ? "View your weekly plan" : "Build a weekly plan"}</p>
            <p className="text-sm text-muted-foreground">{data.plan ? `${data.plan.hours_per_week} hours / week` : "Fit tasks to the hours you have"}</p>
          </div>
          <ArrowRight className="text-primary transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </>
  );
}
