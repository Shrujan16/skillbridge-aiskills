import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, PageSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { appDataQuery, useAppData } from "@/lib/app-data";

export const Route = createFileRoute("/_authenticated/report")({
  loader: ({ context }) => context.queryClient.ensureQueryData(appDataQuery),
  pendingComponent: PageSkeleton,
  head: () => ({
    meta: [
      { title: "Skill report — SkillBridge" },
      { name: "description", content: "Printable skill report with readiness, skill gaps and verified projects." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { data, view } = useAppData();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const profile = data.profile;
  if (!profile) return <EmptyState title="No profile yet" description="Finish onboarding to create your report." />;
  const verified = view.ordered.filter((s) => s.verification?.status === "verified");
  const share = `${origin}/u/${profile.username}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button asChild variant="ghost" className="min-h-11"><Link to="/profile"><ArrowLeft /> Back to profile</Link></Button>
        <Button onClick={() => window.print()} className="min-h-11"><Printer /> Print / Save as PDF</Button>
      </div>
      <article className="report-sheet mx-auto max-w-[210mm] rounded-lg border bg-card p-6 text-card-foreground sm:p-10 print:border-0 print:p-0">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">SkillBridge · Skill report</p>
            <h1 className="mt-1 text-2xl font-semibold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">Target role: {view.role?.name ?? "Not chosen"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Readiness</p>
            <p className="num text-3xl font-semibold">{view.hasAssessment ? `${view.readiness}%` : "—"}</p>
          </div>
        </header>
        <h2 className="mt-6 text-base font-semibold">Skills</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-2 font-medium">Skill</th><th className="py-2 pr-2 font-medium">Weight</th>
              <th className="py-2 pr-2 font-medium">Level</th><th className="py-2 pr-2 font-medium">Gap</th><th className="py-2 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {view.ordered.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 pr-2 font-medium">{s.name}</td>
                  <td className="num py-2 pr-2">{s.weight}</td>
                  <td className="num py-2 pr-2">{Math.round(s.level * 100)}%</td>
                  <td className="num py-2 pr-2">{s.gap.toFixed(2)}</td>
                  <td className="py-2 capitalize">{String(s.status).replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="mt-6 text-base font-semibold">Verified on GitHub</h2>
        {verified.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {verified.map((s) => (
              <li key={s.id}><span className="font-medium">{s.name}</span> — <span className="break-all font-mono text-xs">{s.verification?.repo_url}</span></li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted-foreground">No verified skills yet.</p>}
        <footer className="mt-8 border-t pt-4 text-sm">
          <p className="text-muted-foreground">Public profile</p>
          <p className="break-all font-mono text-xs">{share}</p>
          <p className="mt-2 text-xs text-muted-foreground">Generated {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
        </footer>
      </article>
    </div>
  );
}
