import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { BadgeCheck, Gauge, Lock, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, PageHeader, PageSkeleton, StatTile } from "@/components/app/states";
import { supabase } from "@/integrations/supabase/client";

interface Insights {
  ready: boolean;
  students: number;
  avg_readiness?: number;
  verified?: number;
  skills?: { name: string; weight: number; avg_level: number; avg_gap: number }[];
}

const insightsQuery = queryOptions({
  queryKey: ["cohort-insights"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("get_cohort_insights", { _role_id: 1 });
    if (error) throw new Error("Couldn't load insights right now. Please try again.");
    return (data as unknown as Insights | null) ?? { ready: false, students: 0 };
  },
  staleTime: 60_000,
});

export const Route = createFileRoute("/_authenticated/insights")({
  loader: ({ context }) => context.queryClient.ensureQueryData(insightsQuery),
  pendingComponent: PageSkeleton,
  errorComponent: ({ error }) => <EmptyState title="Insights unavailable" description={error instanceof Error ? error.message : "Please try again."} />,
  head: () => ({
    meta: [
      { title: "College insights — SkillBridge" },
      { name: "description", content: "Anonymous, aggregated skill gaps across a batch of Front-End students." },
    ],
  }),
  component: InsightsPage,
});

const CAPTION = "Designed for placement cells to see skill gaps across a batch, without identifying anyone.";

function InsightsPage() {
  const { data } = useSuspenseQuery(insightsQuery);
  if (!data.ready) {
    return (
      <>
        <PageHeader eyebrow="Front-End Developer · cohort" title="College insights" description={CAPTION} />
        <EmptyState icon={<Lock />} title="Not enough data yet" description={`Insights appear once 5 students have completed the assessment. (${data.students} so far)`} />
      </>
    );
  }
  const skills = data.skills ?? [];
  const chart = skills.map((s) => ({ name: s.name, "Avg level": Math.round(s.avg_level * 100), Demand: s.weight * 10 }));
  return (
    <>
      <PageHeader eyebrow="Front-End Developer · cohort" title="College insights" description={CAPTION} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Students" value={data.students} icon={<Users className="size-4" />} />
        <StatTile label="Avg readiness" value={`${data.avg_readiness ?? 0}%`} icon={<Gauge className="size-4" />} />
        <StatTile label="Verified skills" value={data.verified ?? 0} icon={<BadgeCheck className="size-4" />} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="surface-card p-5">
          <h2 className="text-base font-semibold">Top 5 skill gaps</h2>
          <p className="text-xs text-muted-foreground">Average gap per skill (weight × (1 − level))</p>
          <ol className="mt-4 space-y-3">
            {skills.slice(0, 5).map((s, i) => (
              <li key={s.name} className="flex items-center gap-3 text-sm">
                <span className="num w-5 text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                <span className="num font-semibold">{s.avg_gap.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="surface-card min-w-0 p-5">
          <h2 className="text-base font-semibold">Average level vs demand</h2>
          <p className="text-xs text-muted-foreground">Level in %, demand weight scaled ×10</p>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: -20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Avg level" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Demand" fill="var(--accent)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </>
  );
}
