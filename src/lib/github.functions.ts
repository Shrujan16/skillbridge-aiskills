import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CACHE_MINUTES = 15;
const REPO_RE = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/;

export type VerifyResult =
  | { kind: "ok"; cached: boolean; status: "verified" | "needs_review" }
  | { kind: "rate_limited"; retryAt: string | null }
  | { kind: "error"; message: string };

class RateLimited extends Error {
  constructor(public retryAt: string | null) {
    super("rate_limited");
  }
}

async function gh(path: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "SkillBridge-Verifier",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env["GITHUB_TOKEN"];
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 429 || (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0")) {
    const reset = res.headers.get("x-ratelimit-reset");
    throw new RateLimited(reset ? new Date(Number(reset) * 1000).toISOString() : null);
  }
  return res;
}

export const verifyRepo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({ skillId: z.number().int().positive(), repoUrl: z.string().trim().max(300), force: z.boolean().optional() })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<VerifyResult> => {
    const { supabase, userId } = context;
    const match = data.repoUrl.match(REPO_RE);
    if (!match) return { kind: "error", message: "Use a link like https://github.com/your-name/your-repo" };
    const [, owner, repo] = match as unknown as [string, string, string];
    const repoUrl = `https://github.com/${owner}/${repo}`;

    const [{ data: profile }, { data: skill }, { data: existing }] = await Promise.all([
      supabase.from("profiles").select("github_username").eq("id", userId).maybeSingle(),
      supabase.from("skills").select("id, languages").eq("id", data.skillId).maybeSingle(),
      supabase.from("verifications").select("*").eq("user_id", userId).eq("skill_id", data.skillId).maybeSingle(),
    ]);
    const username = profile?.github_username?.trim();
    if (!username) return { kind: "error", message: "Add your GitHub username first." };
    if (!skill) return { kind: "error", message: "That skill wasn't found." };

    if (
      !data.force &&
      existing &&
      existing.repo_url.toLowerCase() === repoUrl.toLowerCase() &&
      Date.now() - new Date(existing.checked_at).getTime() < CACHE_MINUTES * 60_000
    ) {
      return { kind: "ok", cached: true, status: existing.status as "verified" | "needs_review" };
    }

    const checks: { key: string; label: string; passed: boolean; message?: string | undefined }[] = [];
    let languages: string[] = [];
    let fullName = `${owner}/${repo}`;
    try {
      const repoRes = await gh(`/repos/${owner}/${repo}`);
      if (repoRes.status === 404) {
        checks.push({ key: "exists", label: "Repository exists and is public", passed: false, message: "We couldn't find this repository. Is it public?" });
      } else if (!repoRes.ok) {
        return { kind: "error", message: `GitHub returned an error (${repoRes.status}). Please try again later.` };
      } else {
        const info = (await repoRes.json()) as { private: boolean; full_name: string; owner: { login: string } };
        fullName = info.full_name;
        checks.push({ key: "exists", label: "Repository exists and is public", passed: !info.private, message: info.private ? "The repository is private." : undefined });
        const ownerOk = info.owner.login.toLowerCase() === username.toLowerCase();
        checks.push({
          key: "owner",
          label: "Owned by your GitHub username",
          passed: ownerOk,
          message: ownerOk ? undefined : `Owner is ${info.owner.login}, not ${username}.`,
        });

        const [commitsRes, readmeRes, langRes] = await Promise.all([
          gh(`/repos/${owner}/${repo}/commits?author=${encodeURIComponent(username)}&per_page=1`),
          gh(`/repos/${owner}/${repo}/readme`),
          gh(`/repos/${owner}/${repo}/languages`),
        ]);
        const commits = commitsRes.ok ? ((await commitsRes.json()) as unknown[]) : [];
        checks.push({
          key: "commits",
          label: "Has a commit authored by you",
          passed: commits.length > 0,
          message: commits.length > 0 ? undefined : `No commits authored by ${username} were found.`,
        });
        checks.push({
          key: "readme",
          label: "Has a README",
          passed: readmeRes.ok,
          message: readmeRes.ok ? undefined : "Add a README.md describing the project.",
        });
        languages = langRes.ok ? Object.keys((await langRes.json()) as Record<string, number>) : [];
        const wanted = skill.languages.map((l) => l.toLowerCase());
        const hit = wanted.length === 0 ? languages[0] : languages.find((l) => wanted.includes(l.toLowerCase()));
        checks.push({
          key: "language",
          label: "Uses a relevant language",
          passed: Boolean(hit),
          message: hit ?? `Expected one of: ${skill.languages.join(", ") || "any language"}.`,
        });
      }
    } catch (e) {
      if (e instanceof RateLimited) return { kind: "rate_limited", retryAt: e.retryAt };
      console.error("GitHub verification failed", e);
      return { kind: "error", message: "We couldn't reach GitHub. Please try again in a moment." };
    }

    const status = checks.length === 5 && checks.every((c) => c.passed) ? "verified" : "needs_review";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("verifications").upsert(
      {
        user_id: userId,
        skill_id: skill.id,
        repo_url: repoUrl,
        status,
        details: { checks, languages, full_name: fullName },
        checked_at: new Date().toISOString(),
      },
      { onConflict: "user_id,skill_id" },
    );
    if (error) return { kind: "error", message: "We checked GitHub but couldn't save the result. Please retry." };
    return { kind: "ok", cached: false, status };
  });
