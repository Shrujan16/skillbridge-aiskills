import { createServerFn } from "@tanstack/react-start";
import { addDays, fillWeeks, mondayOf, orderSkills, toISODate, weekEnd } from "./skillbridge";

export const DEMO_EMAIL = "demo@skillbridge.app";
export const DEMO_PASSWORD = "Demo@12345";

const DEMO_LEVELS: Record<string, number> = {
  html: 0.9,
  css: 0.82,
  javascript: 0.55,
  git: 0.7,
  react: 0.3,
  responsive: 0.62,
  "rest-apis": 0.35,
  tailwind: 0.45,
  accessibility: 0.2,
};

/**
 * Makes sure the shared demo account exists and has sample data. Public on purpose (anyone can
 * press "Try the demo"), and it only ever touches the one fixed demo account.
 */
export const ensureDemoAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", "demo")
    .maybeSingle();

  let userId = existing?.id ?? null;

  if (!userId) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Demo Student" },
    });
    if (created.data.user) {
      userId = created.data.user.id;
    } else {
      const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userId = list.data.users.find((u) => u.email === DEMO_EMAIL)?.id ?? null;
    }
    if (!userId) {
      console.error("Demo account creation failed", created.error);
      throw new Error("Could not prepare the demo account. Please try again.");
    }
  }

  const { count } = await supabaseAdmin
    .from("assessments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) > 0) return { ok: true };

  // ---- seed profile ----
  await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, name: "Demo Student", username: "demo", github_username: "skillbridge-demo", target_role_id: 1 });

  const [{ data: skills }, { data: roleSkills }, { data: tasks }] = await Promise.all([
    supabaseAdmin.from("skills").select("*"),
    supabaseAdmin.from("role_skills").select("*").eq("role_id", 1),
    supabaseAdmin.from("roadmap_tasks").select("*").order("seq"),
  ]);
  if (!skills || !roleSkills || !tasks) throw new Error("Demo data is unavailable right now.");

  const today = new Date();
  const takenAt = addDays(today, -15).toISOString();
  await supabaseAdmin.from("assessments").insert(
    skills.map((s) => ({ user_id: userId!, skill_id: s.id, level: DEMO_LEVELS[s.slug] ?? 0.3, taken_at: takenAt })),
  );

  // ---- seed plan: started two weeks ago, 8 hours/week ----
  const start = addDays(mondayOf(today), -14);
  const ordered = orderSkills(
    skills.map((s) => ({
      ...s,
      weight: roleSkills.find((r) => r.skill_id === s.id)?.demand_weight ?? 1,
      level: DEMO_LEVELS[s.slug] ?? 0,
    })),
  );
  const orderedTasks = ordered.flatMap((s) =>
    tasks.filter((t) => t.skill_id === s.id).map((t) => ({ id: t.id, estHours: Number(t.est_hours) })),
  );
  const weeks = fillWeeks(orderedTasks, 8, 1);
  let doneInWeek3 = 0;
  const rows = orderedTasks.map((t) => {
    const week = weeks.get(t.id)!;
    let done = week <= 2;
    if (week === 3 && doneInWeek3 < 1) {
      done = true;
      doneInWeek3 += 1;
    }
    const completedAt = done ? addDays(start, (week - 1) * 7 + 2).toISOString() : null;
    return {
      user_id: userId!,
      task_id: t.id,
      week,
      status: done ? "done" : "todo",
      completed_at: completedAt && new Date(completedAt) > today ? today.toISOString() : completedAt,
    };
  });
  await supabaseAdmin.from("user_tasks").insert(rows);
  const lastWeek = Math.max(...weeks.values());
  await supabaseAdmin.from("plans").upsert({
    user_id: userId,
    hours_per_week: 8,
    start_date: toISODate(start),
    target_date: toISODate(addDays(start, 7 * 9)),
    estimated_finish: toISODate(weekEnd(start, lastWeek)),
  });

  // ---- seed sample proof-of-skill results ----
  const id = (slug: string) => skills.find((s) => s.slug === slug)!.id;
  const passAll = (lang: string) => [
    { key: "exists", label: "Repository exists and is public", passed: true },
    { key: "owner", label: "Owned by your GitHub username", passed: true },
    { key: "commits", label: "Has a commit authored by you", passed: true },
    { key: "readme", label: "Has a README", passed: true },
    { key: "language", label: "Uses a relevant language", passed: true, message: lang },
  ];
  await supabaseAdmin.from("verifications").insert([
    {
      user_id: userId,
      skill_id: id("html"),
      repo_url: "https://github.com/skillbridge-demo/portfolio-page",
      status: "verified",
      details: { sample: true, languages: ["HTML", "CSS"], checks: passAll("HTML") },
      checked_at: addDays(today, -9).toISOString(),
    },
    {
      user_id: userId,
      skill_id: id("css"),
      repo_url: "https://github.com/skillbridge-demo/recipe-cards",
      status: "verified",
      details: { sample: true, languages: ["CSS", "HTML"], checks: passAll("CSS") },
      checked_at: addDays(today, -5).toISOString(),
    },
    {
      user_id: userId,
      skill_id: id("javascript"),
      repo_url: "https://github.com/skillbridge-demo/quiz-game",
      status: "needs_review",
      details: {
        sample: true,
        languages: ["JavaScript", "HTML"],
        checks: [
          ...passAll("JavaScript").filter((c) => c.key !== "readme"),
          { key: "readme", label: "Has a README", passed: false, message: "Add a README.md describing the project." },
        ],
      },
      checked_at: addDays(today, -2).toISOString(),
    },
  ]);

  return { ok: true };
});
