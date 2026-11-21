import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  orderSkills,
  parseISODate,
  readinessPercent,
  skillGap,
  skillStatus,
  weeklyStreak,
  type SkillStatus,
} from "./skillbridge";

export type Profile = Tables<"profiles">;
export type Plan = Tables<"plans">;
export type RoadmapTask = Tables<"roadmap_tasks">;
export type UserTask = Tables<"user_tasks">;

export interface VerificationCheck {
  key: string;
  label: string;
  passed: boolean;
  message?: string;
}
export interface VerificationDetails {
  checks?: VerificationCheck[];
  languages?: string[];
  full_name?: string;
  sample?: boolean;
}
export interface Verification extends Omit<Tables<"verifications">, "details"> {
  details: VerificationDetails;
}

export interface SkillView {
  id: number;
  slug: string;
  name: string;
  category: string;
  weight: number;
  level: number;
  assessed: boolean;
  gap: number;
  status: SkillStatus;
  prerequisites: string[];
  languages: string[];
  tasks: (RoadmapTask & { userTask: UserTask | null })[];
  project: Tables<"skill_projects"> | null;
  verification: Verification | null;
}

export async function fetchAppData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You're signed out. Please sign in again.");

  const [profile, roles, skills, roleSkills, tasks, projects, assessments, userTasks, plan, verifications] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("roles").select("*").order("id"),
      supabase.from("skills").select("*").order("id"),
      supabase.from("role_skills").select("*"),
      supabase.from("roadmap_tasks").select("*").order("seq"),
      supabase.from("skill_projects").select("*"),
      supabase.from("assessments").select("*").eq("user_id", user.id).order("taken_at", { ascending: false }),
      supabase.from("user_tasks").select("*").eq("user_id", user.id),
      supabase.from("plans").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("verifications").select("*").eq("user_id", user.id),
    ]);

  const firstError = [profile, roles, skills, roleSkills, tasks, projects, assessments, userTasks, plan, verifications].find(
    (r) => r.error,
  )?.error;
  if (firstError) throw new Error(firstError.message);

  return {
    user: { id: user.id, email: user.email ?? "" },
    profile: profile.data,
    roles: roles.data ?? [],
    skills: skills.data ?? [],
    roleSkills: roleSkills.data ?? [],
    tasks: tasks.data ?? [],
    projects: projects.data ?? [],
    assessments: assessments.data ?? [],
    userTasks: userTasks.data ?? [],
    plan: plan.data,
    verifications: (verifications.data ?? []) as Verification[],
  };
}

export type AppData = Awaited<ReturnType<typeof fetchAppData>>;

export const appDataQuery = queryOptions({
  queryKey: ["app-data"],
  queryFn: fetchAppData,
  staleTime: 30_000,
});

export function deriveView(data: AppData) {
  const roleId = data.profile?.target_role_id ?? 1;
  const role = data.roles.find((r) => r.id === roleId) ?? null;
  const latest = new Map<number, number>();
  for (const a of data.assessments) if (!latest.has(a.skill_id)) latest.set(a.skill_id, Number(a.level));
  const userTaskById = new Map(data.userTasks.map((u) => [u.task_id, u]));

  const skillViews: SkillView[] = data.roleSkills
    .filter((rs) => rs.role_id === roleId)
    .map((rs) => {
      const s = data.skills.find((k) => k.id === rs.skill_id)!;
      const level = latest.get(s.id) ?? 0;
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        category: s.category,
        weight: rs.demand_weight,
        level,
        assessed: latest.has(s.id),
        gap: skillGap(rs.demand_weight, level),
        status: skillStatus(level),
        prerequisites: s.prerequisites,
        languages: s.languages,
        tasks: data.tasks
          .filter((t) => t.skill_id === s.id)
          .sort((a, b) => a.seq - b.seq)
          .map((t) => ({ ...t, userTask: userTaskById.get(t.id) ?? null })),
        project: data.projects.find((p) => p.skill_id === s.id) ?? null,
        verification: data.verifications.find((v) => v.skill_id === s.id) ?? null,
      };
    })
    .filter((s) => s.name);

  const ordered = orderSkills(skillViews);
  const byGap = [...skillViews].sort((a, b) => b.gap - a.gap);
  const allTasks = ordered.flatMap((s) => s.tasks);
  const doneTasks = allTasks.filter((t) => t.userTask?.status === "done");
  const completedDates = doneTasks
    .map((t) => (t.userTask?.completed_at ? new Date(t.userTask.completed_at) : null))
    .filter((d): d is Date => d !== null);

  return {
    role,
    skills: skillViews,
    ordered,
    byGap,
    hasAssessment: data.assessments.length > 0,
    lastAssessedAt: data.assessments[0]?.taken_at ?? null,
    readiness: readinessPercent(skillViews.map((s) => ({ weight: s.weight, level: s.level }))),
    allTasks,
    doneCount: doneTasks.length,
    totalCount: allTasks.length,
    streak: weeklyStreak(completedDates, new Date()),
    verifiedCount: data.verifications.filter((v) => v.status === "verified").length,
    planStart: data.plan ? parseISODate(data.plan.start_date) : null,
  };
}

export function useAppData() {
  const { data } = useSuspenseQuery(appDataQuery);
  return { data, view: deriveView(data) };
}

export async function setTaskDone(userId: string, taskId: number, done: boolean) {
  const { error } = await supabase.from("user_tasks").upsert(
    {
      user_id: userId,
      task_id: taskId,
      status: done ? "done" : "todo",
      completed_at: done ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,task_id" },
  );
  if (error) throw new Error(error.message);
}

export function shareUrl(username: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/u/${username}`;
}
