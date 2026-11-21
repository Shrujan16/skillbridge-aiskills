import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type SkillStatus } from "@/lib/skillbridge";

const VARIANT: Record<SkillStatus, "success" | "warning" | "danger"> = {
  completed: "success",
  in_progress: "warning",
  needs_practice: "danger",
};

export function StatusBadge({ status }: { status: SkillStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
