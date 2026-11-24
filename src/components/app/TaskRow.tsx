import { useQueryClient } from "@tanstack/react-query";
import { Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { appDataQuery, setTaskDone, type RoadmapTask, type UserTask } from "@/lib/app-data";
import { cn } from "@/lib/utils";

export function TaskRow({ task, userId, badge }: { task: RoadmapTask & { userTask: UserTask | null }; userId: string; badge?: React.ReactNode }) {
  const queryClient = useQueryClient();
  const serverDone = task.userTask?.status === "done";
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const done = optimistic ?? serverDone;

  async function toggle(next: boolean) {
    setOptimistic(next);
    try {
      await setTaskDone(userId, task.id, next);
      await queryClient.invalidateQueries({ queryKey: appDataQuery.queryKey });
      if (next) toast.success("Nice work! Task completed.");
    } catch {
      toast.error("Couldn't update the task. Please try again.");
    } finally {
      setOptimistic(null);
    }
  }

  return (
    <li className={cn("flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors", done && "bg-muted/60")}>
      <Checkbox
        id={`task-${task.id}`}
        checked={done}
        onCheckedChange={(v) => toggle(v === true)}
        className="mt-0.5 size-5 rounded-md"
        aria-label={`Mark "${task.title}" as done`}
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={`task-${task.id}`} className={cn("cursor-pointer font-semibold", done && "text-muted-foreground line-through")}>
          {task.title}
        </label>
        <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3.5" /> <span className="num">{Number(task.est_hours)} h</span>
          </span>
          <a href={task.resource_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            Learn <ExternalLink className="size-3.5" />
          </a>
          {badge}
        </div>
      </div>
    </li>
  );
}
