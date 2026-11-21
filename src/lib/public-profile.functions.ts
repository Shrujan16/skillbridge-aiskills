import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export interface PublicProfile {
  name: string;
  username: string;
  github_username: string | null;
  role: string | null;
  readiness: number | null;
  verified: { skill: string; project: string | null; repo_url: string; checked_at: string }[];
}

export const getPublicProfile = createServerFn({ method: "GET" })
  .validator((input) => z.object({ username: z.string().trim().min(1).max(60) }).parse(input))
  .handler(async ({ data }): Promise<PublicProfile | null> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: result, error } = await client.rpc("get_public_profile", { _username: data.username });
    if (error) throw new Error("Couldn't load this profile right now.");
    return (result as unknown as PublicProfile | null) ?? null;
  });
