import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Check, Code2, Loader2, Server } from "lucide-react";
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

const ICONS: Record<string, typeof Code2> = {
  "Front-End Developer": Code2,
  "Back-End Developer": Server,
  "Data Analyst": BarChart3,
};
const BLURB: Record<string, string> = {
  "Front-End Developer": "Build the interfaces people use every day — HTML, CSS, JavaScript and React.",
  "Back-End Developer": "APIs, databases and servers that power applications.",
  "Data Analyst": "Turn data into decisions with SQL, spreadsheets and dashboards.",
};

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
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Step 1 of 2" title="Which role are you aiming for?" description="We'll weight every skill by how often employers ask for it in this role." />
      <div className="grid gap-4 md:grid-cols-3">
        {data.roles.map((r) => {
          const Icon = ICONS[r.name] ?? Code2;
          const active = selected === r.id;
          return (
            <button
              key={r.id}
              type="button"
              disabled={!r.active}
              onClick={() => setSelected(r.id)}
              aria-pressed={active}
              className={cn(
                "surface-card relative flex flex-col items-start gap-3 p-5 text-left transition-all",
                r.active ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lift" : "cursor-not-allowed opacity-60",
                active && "ring-2 ring-primary",
              )}
            >
              <div className="flex w-full items-start justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </span>
                {r.active ? (
                  active && (
                    <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-4" />
                    </span>
                  )
                ) : (
                  <Badge variant="secondary">Coming soon</Badge>
                )}
              </div>
              <span className="font-display text-lg font-bold">{r.name}</span>
              <span className="text-sm text-muted-foreground">{BLURB[r.name]}</span>
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
