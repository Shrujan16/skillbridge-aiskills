import { supabase } from "@/integrations/supabase/client";
import type { SkillView } from "./app-data";
import { mondayOf, rebalancePlan, toISODate, weekIndex, type PlannedTask } from "./skillbridge";

export function plannedTasks(ordered: SkillView[]): PlannedTask[] {
  return ordered.flatMap((s) =>
    s.tasks.map((t) => ({
      id: t.id,
      estHours: Number(t.est_hours),
      week: t.userTask?.week ?? null,
      done: t.userTask?.status === "done",
      completedAt: t.userTask?.completed_at ? new Date(t.userTask.completed_at) : null,
    })),
  );
}

/** Builds (fresh = true) or re-balances the plan and saves weeks to user_tasks. */
export async function savePlan(opts: {
  userId: string;
  ordered: SkillView[];
  hoursPerWeek: number;
  targetDate: string;
  startDate?: string | undefined; // keep existing start when re-balancing
}) {
  const today = new Date();
  const start = opts.startDate ? new Date(`${opts.startDate}T00:00:00`) : mondayOf(today);
  const tasks = plannedTasks(opts.ordered);
  const result = rebalancePlan(tasks, opts.hoursPerWeek, start, today);

  const rows = tasks.map((t) => {
    if (!t.done) return { user_id: opts.userId, task_id: t.id, week: result.weeks.get(t.id)! };
    const w = t.completedAt ? weekIndex(start, t.completedAt) : null;
    return { user_id: opts.userId, task_id: t.id, week: w !== null && w >= 1 ? w : null };
  });
  const { error: taskErr } = await supabase.from("user_tasks").upsert(rows, { onConflict: "user_id,task_id" });
  if (taskErr) throw new Error(taskErr.message);

  const anyOpen = tasks.some((t) => !t.done);
  const { error } = await supabase.from("plans").upsert({
    user_id: opts.userId,
    hours_per_week: opts.hoursPerWeek,
    target_date: opts.targetDate,
    start_date: toISODate(start),
    estimated_finish: toISODate(anyOpen ? result.finish : today),
    last_rebalanced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return result;
}
