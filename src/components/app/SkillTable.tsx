import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import type { SkillView } from "@/lib/app-data";
import { cn } from "@/lib/utils";

function Bar({ value, tone }: { value: number; tone: "primary" | "accent" | "muted" }) {
  return (
    <div className="h-1 w-full rounded-full bg-muted" aria-hidden="true">
      <div
        className={cn("h-1 rounded-full", tone === "primary" && "bg-primary", tone === "accent" && "bg-accent", tone === "muted" && "bg-muted-foreground/60")}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/** Skill table for the dashboard. Rows come pre-computed from deriveView; this only sorts by gap. */
export function SkillTable({ skills }: { skills: SkillView[] }) {
  const [dir, setDir] = useState<"desc" | "asc">("desc");
  const rows = useMemo(() => [...skills].sort((a, b) => (dir === "desc" ? b.gap - a.gap : a.gap - b.gap)), [skills, dir]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th scope="col" className="px-4 py-2.5 font-medium">Skill</th>
            <th scope="col" className="w-36 px-4 py-2.5 font-medium">Demand weight</th>
            <th scope="col" className="w-36 px-4 py-2.5 font-medium">Your level</th>
            <th scope="col" className="w-32 px-4 py-2.5 font-medium" aria-sort={dir === "desc" ? "descending" : "ascending"}>
              <button
                type="button"
                onClick={() => setDir((d) => (d === "desc" ? "asc" : "desc"))}
                className="-mx-1 inline-flex items-center gap-1 rounded px-1 font-medium text-foreground hover:text-primary"
                aria-label={`Sort by gap, currently ${dir === "desc" ? "largest first" : "smallest first"}`}
              >
                Gap {dir === "desc" ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />}
              </button>
            </th>
            <th scope="col" className="w-36 px-4 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((s) => (
            <tr key={s.id} className="transition-colors hover:bg-muted/60">
              <th scope="row" className="px-4 py-3 text-left font-medium">{s.name}</th>
              <td className="px-4 py-3">
                <div className="num mb-1.5 text-xs">{s.weight}<span className="text-muted-foreground">/10</span></div>
                <Bar value={s.weight * 10} tone="accent" />
              </td>
              <td className="px-4 py-3">
                <div className="num mb-1.5 text-xs">{Math.round(s.level * 100)}%</div>
                <Bar value={s.level * 100} tone="primary" />
              </td>
              <td className="px-4 py-3">
                <div className="num mb-1.5 text-xs font-semibold">{s.gap.toFixed(2)}</div>
                <Bar value={s.gap * 10} tone="muted" />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={s.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
