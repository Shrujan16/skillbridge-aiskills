<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## SkillBridge architecture

- Scoring, ordering, weekly-fill and re-balance rules live as pure functions in `src/lib/skillbridge.ts` with tests beside them; UI and I/O call them, never re-implement them — keeps the rules testable in one place.
- Signed-in pages live under `src/routes/_authenticated/` and read everything through the single `appDataQuery` (`src/lib/app-data.ts`) using the browser client with RLS; mutations invalidate that one query — one source of truth for derived views.
- `verifications` rows are written only by the `verifyRepo` server function with the admin client after it checks GitHub; students have read-only access — prevents self-verification.
- Public profiles (`/u/$username`) read only through the `get_public_profile` SECURITY DEFINER function, which returns verified data only — no anon access to tables.
- The demo account is created/seeded on demand by the public `ensureDemoAccount` server function, which only touches the fixed demo user — auth users can't be seeded from migrations.
- GitHub calls are unauthenticated by default; an optional `GITHUB_TOKEN` secret raises the rate limit.
- Dark mode is a `dark` class on `<html>`, saved under the `sb-theme` localStorage key and applied by a pre-paint script in `__root.tsx`; components use semantic tokens only — avoids a light flash and keeps both themes in one palette.
- Cohort insights come only from the `get_cohort_insights` SECURITY DEFINER function (aggregates, min 5 students) — no individual rows exposed.
