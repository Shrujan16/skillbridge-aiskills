import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarCheck2, Flame, Loader2, RefreshCw, Settings2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { TaskRow } from "@/components/app/TaskRow";
import { PageHeader, PageSkeleton, StatTile } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { appDataQuery, useAppData } from "@/lib/app-data";
import { plannedTasks, savePlan } from "@/lib/planner";
import { addDays, hasOverdue, mondayOf, parseISODate, toISODate, weekIndex } from "@/lib/skillbridge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/plan")({
  loader: ({ context }) => context.queryClient.ensureQueryData(appDataQuery),
  pendingComponent: PageSkeleton,
  head: () => ({ meta: [{ title: "Weekly plan — SkillBridge" }] }),
  component: PlanPage,
});

const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
const fmtLong = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function PlanForm({ initialHours, initialTarget, onSubmit, busy, submitLabel }: { initialHours: number; initialTarget: string; onSubmit: (h: number, t: string) => void; busy: boolean; submitLabel: string }) {
  const [hours, setHours] = useState(String(initialHours));
  const [target, setTarget] = useState(initialTarget);
  const [errors, setErrors] = useState<{ hours?: string; target?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const h = Number(hours);
    const next: typeof errors = {};
    if (!Number.isInteger(h) || h < 1 || h > 60) next.hours = "Enter whole hours between 1 and 60";
    if (!target) next.target = "Pick a target date";
    else if (parseISODate(target) <= new Date()) next.target = "Target date must be in the future";
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(h, target);
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="hours">Hours available per week</Label>
        <Input id="hours" type="number" min={1} max={60} inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} />
        {errors.hours && <p className="text-xs font-medium text-destructive" role="alert">{errors.hours}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="target">Target date</Label>
        <Input id="target" type="date" value={target} min={toISODate(addDays(new Date(), 1))} onChange={(e) => setTarget(e.target.value)} />
        {errors.target && <p className="text-xs font-medium text-destructive" role="alert">{errors.target}</p>}
      </div>
      <Button type="submit" size="lg" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />} {submitLabel}
      </Button>
    </form>
  );
}

function PlanPage() {
  const { data, view } = useAppData();
  const queryClient = useQueryClient();
  const plan = data.plan;
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const autoRan = useRef(false);

  async function run(hours: number, target: string, keepStart: boolean, reason: "create" | "rebalance" | "auto") {
    setBusy(true);
    try {
      const result = await savePlan({
        userId: data.user.id,
        ordered: view.ordered,
        hoursPerWeek: hours,
        targetDate: target,
        startDate: keepStart ? plan?.start_date : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: appDataQuery.queryKey });
      const finish = fmtLong(result.finish);
      if (reason === "auto") {
        toast.info(`Last week had unfinished tasks — we moved ${result.movedOverdue} forward.`, { description: `New estimated finish: ${finish}` });
      } else if (reason === "rebalance") {
        toast.success("Plan re-balanced", { description: `Estimated finish: ${finish}` });
      } else {
        toast.success("Your weekly plan is ready", { description: `Estimated finish: ${finish}` });
      }
      setEditing(false);
    } catch {
      toast.error("Couldn't save your plan. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const tasks = plannedTasks(view.ordered);
  const planStart = plan ? parseISODate(plan.start_date) : null;
  const overdue = plan && planStart ? hasOverdue(tasks, planStart, new Date()) : false;

  useEffect(() => {
    if (plan && overdue && !autoRan.current && !busy) {
      autoRan.current = true;
      void run(plan.hours_per_week, plan.target_date, true, "auto");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, overdue]);

  if (!plan || !planStart) {
    return (
      <>
        <PageHeader eyebrow="Adaptive planner" title="Build your weekly plan" description="Tell us how much time you have. We'll fill each week with roadmap tasks — prerequisites first, then your biggest gaps." />
        <div className="surface-card p-5 sm:p-6">
          <PlanForm initialHours={8} initialTarget={toISODate(addDays(new Date(), 7 * 10))} busy={busy} submitLabel="Create plan" onSubmit={(h, t) => run(h, t, false, "create")} />
        </div>
      </>
    );
  }

  const currentWeek = Math.max(1, weekIndex(planStart, new Date()));
  const byWeek = new Map<number, typeof view.allTasks>();
  for (const t of view.allTasks) {
    const w = t.userTask?.week;
    if (!w) continue;
    byWeek.set(w, [...(byWeek.get(w) ?? []), t]);
  }
  const weeks = [...byWeek.keys()].sort((a, b) => a - b);
  const planTasks = weeks.flatMap((w) => byWeek.get(w)!);
  const planDone = planTasks.filter((t) => t.userTask?.status === "done").length;
  const pct = planTasks.length ? Math.round((planDone / planTasks.length) * 100) : 0;
  const finish = plan.estimated_finish ? parseISODate(plan.estimated_finish) : null;
  const target = parseISODate(plan.target_date);
  const late = finish ? finish > target : false;

  return (
    <>
      <PageHeader
        eyebrow="Adaptive planner"
        title="Your weekly plan"
        description={`${plan.hours_per_week} hours per week · started ${fmtLong(planStart)}`}
        action={
          <>
            <Button variant="outline" onClick={() => setEditing((e) => !e)}>
              <Settings2 /> Edit inputs
            </Button>
            <Button onClick={() => run(plan.hours_per_week, plan.target_date, true, "rebalance")} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Re-balance plan
            </Button>
          </>
        }
      />

      {editing && (
        <div className="surface-card mb-4 p-5">
          <PlanForm initialHours={plan.hours_per_week} initialTarget={plan.target_date} busy={busy} submitLabel="Rebuild plan" onSubmit={(h, t) => run(h, t, true, "rebalance")} />
        </div>
      )}

      {late && finish && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-4 text-warning-foreground" role="alert">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">You're on track to finish after your target date.</p>
            <p>
              Estimated finish {fmtLong(finish)} vs target {fmtLong(target)}. Add a few hours per week or move your target date.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="surface-card col-span-2 p-4 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            Plan progress <span className="num text-sm text-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="mt-3 h-2.5" aria-label="Plan progress" />
          <p className="mt-2 text-xs text-muted-foreground">
            {planDone} of {planTasks.length} tasks
          </p>
        </div>
        <StatTile label="Streak" value={`${view.streak} wk`} icon={<Flame className="size-4" />} />
        <StatTile label="Estimated finish" value={finish ? fmt(finish) : "—"} hint={late ? "after target" : "on track"} icon={<CalendarCheck2 className="size-4" />} />
        <StatTile label="Target date" value={fmt(target)} hint={`Week ${currentWeek} of plan`} />
      </div>

      <div className="space-y-4">
        {weeks.map((w) => {
          const list = byWeek.get(w)!;
          const hours = list.reduce((s, t) => s + Number(t.est_hours), 0);
          const doneHours = list.filter((t) => t.userTask?.status === "done").reduce((s, t) => s + Number(t.est_hours), 0);
          const startD = addDays(mondayOf(planStart), (w - 1) * 7);
          const isCurrent = w === currentWeek;
          const isPast = w < currentWeek;
          return (
            <section key={w} className={cn("surface-card p-4 sm:p-5", isCurrent && "ring-2 ring-primary", isPast && "opacity-75")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Week {w}</h2>
                  <span className="text-sm text-muted-foreground">
                    {fmt(startD)} – {fmt(addDays(startD, 6))}
                  </span>
                  {isCurrent && <Badge variant="soft">This week</Badge>}
                </div>
                <span className={cn("text-sm font-semibold", hours > plan.hours_per_week ? "text-warning-foreground" : "text-muted-foreground")}>
                  <span className="num">{doneHours}/{hours} h · limit {plan.hours_per_week} h</span>
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-primary-soft">
                <div className="h-1.5 rounded-full bg-brand" style={{ width: `${hours ? (doneHours / hours) * 100 : 0}%` }} />
              </div>
              <ul className="mt-4 space-y-2">
                {list.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    userId={data.user.id}
                    badge={<span className="text-muted-foreground">{view.skills.find((s) => s.id === t.skill_id)?.name}</span>}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {weeks.length === 0 && (
          <div className="surface-card p-8 text-center text-muted-foreground">Every task is done — amazing! Retake the assessment to see your new readiness.</div>
        )}
      </div>
    </>
  );
}
