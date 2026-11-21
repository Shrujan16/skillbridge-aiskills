// Pure scoring and planning rules for SkillBridge. No I/O here so the rules are easy to test.

export type SkillStatus = "completed" | "in_progress" | "needs_practice";

const round = (n: number, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Level per skill = 0.7 x quiz score + 0.3 x (familiarity / 5), from 0 to 1. */
export function computeLevel(correct: number, total: number, familiarity: number): number {
  const quiz = total > 0 ? clamp(correct / total, 0, 1) : 0;
  return round(0.7 * quiz + 0.3 * (clamp(familiarity, 0, 5) / 5));
}

/** Readiness % = 100 x SUM(weight x level) / SUM(weight). */
export function readinessPercent(items: { weight: number; level: number }[]): number {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  if (totalWeight === 0) return 0;
  const score = items.reduce((s, i) => s + i.weight * i.level, 0);
  return Math.round((100 * score) / totalWeight);
}

/** Gap = weight x (1 - level). */
export function skillGap(weight: number, level: number): number {
  return round(weight * (1 - level), 2);
}

export function skillStatus(level: number): SkillStatus {
  if (level >= 0.8) return "completed";
  if (level >= 0.4) return "in_progress";
  return "needs_practice";
}

export const STATUS_LABEL: Record<SkillStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  needs_practice: "Needs practice",
};

export interface OrderableSkill {
  slug: string;
  weight: number;
  level: number;
  prerequisites: string[];
}

/**
 * Orders skills so prerequisites always come first (HTML → CSS → JavaScript → React, etc.),
 * and among skills that are ready, the one with the biggest gap goes next.
 */
export function orderSkills<T extends OrderableSkill>(skills: T[]): T[] {
  const known = new Set(skills.map((s) => s.slug));
  const placed = new Set<string>();
  const remaining = [...skills];
  const result: T[] = [];
  while (remaining.length > 0) {
    const ready = remaining.filter((s) =>
      s.prerequisites.every((p) => !known.has(p) || placed.has(p)),
    );
    const pool = ready.length > 0 ? ready : remaining; // guard against cycles
    pool.sort((a, b) => skillGap(b.weight, b.level) - skillGap(a.weight, a.level));
    const next = pool[0]!;
    result.push(next);
    placed.add(next.slug);
    remaining.splice(remaining.indexOf(next), 1);
  }
  return result;
}

export interface FillableTask {
  id: number;
  estHours: number;
}

/**
 * Fills weeks with tasks in the given order until the weekly hour limit is reached.
 * A task longer than the limit gets a week to itself. `firstWeekUsed` is hours already
 * spent in the starting week (used when re-balancing mid-week).
 */
export function fillWeeks(
  tasks: FillableTask[],
  hoursPerWeek: number,
  startWeek = 1,
  firstWeekUsed = 0,
): Map<number, number> {
  const out = new Map<number, number>();
  let week = startWeek;
  let used = firstWeekUsed;
  for (const t of tasks) {
    if (used > 0 && used + t.estHours > hoursPerWeek) {
      week += 1;
      used = 0;
    }
    out.set(t.id, week);
    used += t.estHours;
  }
  return out;
}

// ---------- dates (all in local calendar days, weeks start Monday) ----------

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() + n);
  return r;
}

export function mondayOf(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - offset);
  return r;
}

const DAY = 24 * 60 * 60 * 1000;

/** 1-based week number of `date` in a plan that starts on `start` (a Monday). */
export function weekIndex(start: Date, date: Date): number {
  const a = mondayOf(start).getTime();
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.floor(Math.round((b - a) / DAY) / 7) + 1;
}

/** The Sunday that ends week `week` of a plan starting on `start`. */
export function weekEnd(start: Date, week: number): Date {
  return addDays(mondayOf(start), week * 7 - 1);
}

/** Consecutive weeks (ending this week, or last week if nothing yet this week) with at least one finished task. */
export function weeklyStreak(completedAt: Date[], today: Date): number {
  if (completedAt.length === 0) return 0;
  const weeks = new Set(completedAt.map((d) => toISODate(mondayOf(d))));
  let cursor = mondayOf(today);
  if (!weeks.has(toISODate(cursor))) cursor = addDays(cursor, -7);
  let streak = 0;
  while (weeks.has(toISODate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

export interface PlannedTask {
  id: number;
  estHours: number;
  week: number | null;
  done: boolean;
  completedAt: Date | null;
}

/**
 * Re-balance: unfinished tasks (including ones left over from past weeks) are re-packed from the
 * current week onward in priority order; finished tasks keep their week.
 */
export function rebalancePlan(
  orderedTasks: PlannedTask[],
  hoursPerWeek: number,
  planStart: Date,
  today: Date,
): { weeks: Map<number, number>; movedOverdue: number; lastWeek: number; finish: Date } {
  const currentWeek = Math.max(1, weekIndex(planStart, today));
  const doneThisWeek = orderedTasks
    .filter((t) => t.done && t.completedAt && weekIndex(planStart, t.completedAt) === currentWeek)
    .reduce((s, t) => s + t.estHours, 0);
  const open = orderedTasks.filter((t) => !t.done);
  const movedOverdue = open.filter((t) => t.week !== null && t.week < currentWeek).length;
  const weeks = fillWeeks(open, hoursPerWeek, currentWeek, Math.min(doneThisWeek, hoursPerWeek));
  const lastWeek = weeks.size > 0 ? Math.max(...weeks.values()) : currentWeek;
  return { weeks, movedOverdue, lastWeek, finish: weekEnd(planStart, lastWeek) };
}

/** True when an unfinished task is scheduled in a week that is already over. */
export function hasOverdue(tasks: PlannedTask[], planStart: Date, today: Date): boolean {
  const current = weekIndex(planStart, today);
  return tasks.some((t) => !t.done && t.week !== null && t.week < current);
}
