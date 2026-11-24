import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { appDataQuery, useAppData } from "@/lib/app-data";
import { computeLevel } from "@/lib/skillbridge";
import { cn } from "@/lib/utils";

const questionsQuery = queryOptions({
  queryKey: ["questions"],
  queryFn: async () => {
    const { data, error } = await supabase.from("questions").select("*").order("id");
    if (error) throw new Error(error.message);
    return data;
  },
  staleTime: Infinity,
});

export const Route = createFileRoute("/_authenticated/assessment")({
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(appDataQuery), context.queryClient.ensureQueryData(questionsQuery)]),
  pendingComponent: PageSkeleton,
  head: () => ({ meta: [{ title: "Skill assessment — SkillBridge" }] }),
  component: Assessment,
});

const FAMILIARITY = ["Never used it", "Heard of it", "Tried a tutorial", "Built something small", "Comfortable", "Could teach it"];

type Step =
  | { kind: "question"; skillId: number; skillName: string; questionId: number; question: string; options: string[] }
  | { kind: "familiarity"; skillId: number; skillName: string };

function Assessment() {
  const { data, view } = useAppData();
  const { data: questions } = useSuspenseQuery(questionsQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const steps = useMemo<Step[]>(() => {
    const out: Step[] = [];
    for (const s of view.ordered) {
      for (const q of questions.filter((q) => q.skill_id === s.id).slice(0, 2)) {
        out.push({ kind: "question", skillId: s.id, skillName: s.name, questionId: q.id, question: q.question, options: q.options as string[] });
      }
      out.push({ kind: "familiarity", skillId: s.id, skillName: s.name });
    }
    return out;
  }, [view.ordered, questions]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [familiarity, setFamiliarity] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);

  const step = steps[index];
  const answered = step ? (step.kind === "question" ? answers[step.questionId] !== undefined : true) : false;
  const isLast = index === steps.length - 1;

  async function finish() {
    setSaving(true);
    const rows = view.skills.map((s) => {
      const qs = questions.filter((q) => q.skill_id === s.id).slice(0, 2);
      const correct = qs.filter((q) => answers[q.id] === q.correct_index).length;
      return { user_id: data.user.id, skill_id: s.id, level: computeLevel(correct, qs.length, familiarity[s.id] ?? 0) };
    });
    const { error } = await supabase.from("assessments").insert(rows);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save your results. Please try again.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: appDataQuery.queryKey });
    toast.success("Assessment complete — here's your readiness.");
    navigate({ to: "/dashboard" });
  }

  if (!step) return null;
  const pct = Math.round(((index + (answered ? 1 : 0)) / steps.length) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-accent">{step.skillName}</span>
          <span className="text-muted-foreground">
            {index + 1} / {steps.length}
          </span>
        </div>
        <Progress value={pct} aria-label="Assessment progress" />
      </div>

      <div key={index} className="surface-card animate-rise p-6 sm:p-8">
        {step.kind === "question" ? (
          <>
            <h1 className="text-xl font-bold sm:text-2xl">{step.question}</h1>
            <div className="mt-6 grid gap-3" role="radiogroup">
              {step.options.map((opt, i) => {
                const active = answers[step.questionId] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setAnswers((a) => ({ ...a, [step.questionId]: i }))}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm font-medium transition-all hover:border-primary/50",
                      active && "border-primary bg-primary-soft text-primary",
                    )}
                  >
                    <span className={cn("grid size-7 shrink-0 place-items-center rounded-md border font-mono text-xs", active && "border-primary bg-primary text-primary-foreground")}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <code className="font-sans">{opt}</code>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold sm:text-2xl">How familiar are you with {step.skillName}?</h1>
            <p className="mt-2 text-sm text-muted-foreground">Be honest — this counts for 30% of your skill level.</p>
            <div className="mt-10 px-1">
              <Slider
                min={0}
                max={5}
                step={1}
                value={[familiarity[step.skillId] ?? 0]}
                onValueChange={([v]) => setFamiliarity((f) => ({ ...f, [step.skillId]: v ?? 0 }))}
                aria-label={`Familiarity with ${step.skillName}`}
              />
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
              <p className="mt-6 text-center font-display text-lg font-semibold text-primary">
                {FAMILIARITY[familiarity[step.skillId] ?? 0]}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0 || saving}>
          <ArrowLeft /> Back
        </Button>
        {isLast ? (
          <Button size="lg" onClick={finish} disabled={!answered || saving}>
            {saving && <Loader2 className="animate-spin" />} See my results
          </Button>
        ) : (
          <Button size="lg" onClick={() => setIndex((i) => i + 1)} disabled={!answered}>
            Next <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
