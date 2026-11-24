import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Lock } from "lucide-react";
import { StatusBadge } from "@/components/app/StatusBadge";
import { TaskRow } from "@/components/app/TaskRow";
import { PageHeader, PageSkeleton, StatTile } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { appDataQuery, useAppData } from "@/lib/app-data";

export const Route = createFileRoute("/_authenticated/roadmap")({
  loader: ({ context }) => context.queryClient.ensureQueryData(appDataQuery),
  pendingComponent: PageSkeleton,
  head: () => ({ meta: [{ title: "Roadmap — SkillBridge" }] }),
  component: Roadmap,
});

function Roadmap() {
  const { data, view } = useAppData();
  const pct = view.totalCount ? Math.round((view.doneCount / view.totalCount) * 100) : 0;
  const nameBySlug = new Map(view.skills.map((s) => [s.slug, s.name]));
  const hoursLeft = view.allTasks.filter((t) => t.userTask?.status !== "done").reduce((s, t) => s + Number(t.est_hours), 0);

  return (
    <>
      <PageHeader
        eyebrow={view.role?.name}
        title="Your roadmap"
        description="Skills ordered by prerequisites first, then by your biggest gaps. Tick tasks off as you go."
        action={
          !view.hasAssessment && (
            <Button asChild>
              <Link to="/assessment">Take assessment to personalise</Link>
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Progress <span className="num text-sm text-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="mt-3 h-2.5" aria-label="Roadmap progress" />
          <p className="mt-2 text-xs text-muted-foreground">
            {view.doneCount} of {view.totalCount} tasks done
          </p>
        </div>
        <StatTile label="Weekly streak" value={`${view.streak} week${view.streak === 1 ? "" : "s"}`} hint="weeks in a row with a finished task" icon={<Flame className="size-4" />} />
        <StatTile label="Hours left" value={`${hoursLeft} h`} hint="estimated across all open tasks" />
      </div>

      <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-border">
        {view.ordered.map((s, i) => {
          const done = s.tasks.filter((t) => t.userTask?.status === "done").length;
          return (
            <li key={s.id} className="relative pl-12">
              <span className="absolute left-0 top-4 grid size-10 place-items-center rounded-full border-4 border-background bg-primary font-mono text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <section className="surface-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">{s.name}</h2>
                      {view.hasAssessment && <StatusBadge status={s.status} />}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Demand {s.weight}/10 · Level {Math.round(s.level * 100)}% · Gap {s.gap.toFixed(1)}
                      {s.prerequisites.length > 0 && (
                        <span className="ml-1 inline-flex items-center gap-1">
                          · <Lock className="size-3" /> after {s.prerequisites.map((p) => nameBySlug.get(p) ?? p).join(", ")}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {done}/{s.tasks.length} done
                  </span>
                </div>
                <ul className="mt-4 space-y-2">
                  {s.tasks.map((t) => (
                    <TaskRow key={t.id} task={t} userId={data.user.id} />
                  ))}
                </ul>
              </section>
            </li>
          );
        })}
      </ol>
    </>
  );
}
