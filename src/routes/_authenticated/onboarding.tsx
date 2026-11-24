import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Check, Code2, Loader2, Lock, Server } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, PageSkeleton } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { appDataQuery, useAppData } from "@/lib/app-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  loader: ({ context }) => context.queryClient.ensureQueryData(appDataQuery),
  pendingComponent: PageSkeleton,
  head: () => ({ meta: [{ title: "Choose your target role — SkillBridge" }] }),
  component: Onboarding,
});

const LOCKED_MESSAGE = "Planned extension. SkillBridge adds a new role by adding a new skill-demand map.";

/** The three role cards always render; DB rows decide which ones are selectable. */
const ROLE_CARDS = [
  {
    name: "Front-End Developer",
    icon: Code2,
    blurb: "Build the interfaces people use every day.",
    skills: ["HTML", "CSS", "JavaScript", "React"],
  },
  {
    name: "Back-End Developer",
    icon: Server,
    blurb: "APIs, databases and servers that power applications.",
    skills: ["Node.js", "REST APIs", "SQL", "Auth"],
  },
  {
    name: "Data Analyst",
    icon: BarChart3,
    blurb: "Turn data into decisions with queries and dashboards.",
    skills: ["Python", "SQL", "Statistics", "Visualization"],
  },
] as const;

function Onboarding() {
  const { data, view } = useAppData();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(data.profile?.target_role_id ?? null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ target_role_id: selected }).eq("id", data.user.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save your role. Please try again.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: appDataQuery.queryKey });
    navigate({ to: view.hasAssessment ? "/dashboard" : "/assessment" });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Step 1 of 2" title="Which role are you aiming for?" description="We'll weight every skill by how often employers ask for it in this role." />
      <div className="grid gap-3 md:grid-cols-3">
        {ROLE_CARDS.map((card) => {
          const row = data.roles.find((r) => r.name === card.name);
          const available = Boolean(row?.active);
          const active = available && selected === row!.id;
          const Icon = card.icon;
          return (
            <button
              key={card.name}
              type="button"
              aria-disabled={!available}
              aria-pressed={available ? active : undefined}
              onClick={() => (available ? setSelected(row!.id) : toast(LOCKED_MESSAGE))}
              className={cn(
                "surface-card relative flex flex-col items-start gap-3 p-5 text-left transition-colors",
                available ? "cursor-pointer hover:border-primary/50" : "cursor-not-allowed",
                active && "border-primary ring-1 ring-primary",
              )}
            >
              <div className={cn("flex w-full flex-col gap-3", !available && "opacity-60")}>
                <div className="flex w-full items-start justify-between">
                  <span className={cn("grid size-9 place-items-center rounded-md border", available ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground")}>
                    <Icon className="size-4" />
                  </span>
                  {available ? (
                    active ? (
                      <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5" />
                      </span>
                    ) : (
                      <Badge variant="success">Available</Badge>
                    )
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Lock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      <Badge variant="secondary">Coming soon</Badge>
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-base font-semibold">{card.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{card.blurb}</span>
                </div>
                <ul className="flex flex-wrap gap-1.5" aria-label={`Example skills for ${card.name}`}>
                  {card.skills.map((sk) => (
                    <li key={sk} className="rounded-md border bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {sk}
                    </li>
                  ))}
                </ul>
              </div>
              {!available && <span className="sr-only">Locked. {LOCKED_MESSAGE}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={save} disabled={!selected || saving}>
          {saving && <Loader2 className="animate-spin" />} Continue
        </Button>
      </div>
    </div>
  );
}
