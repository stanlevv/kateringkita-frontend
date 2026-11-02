import type { LucideIcon } from "lucide-react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { Nada } from "@/lib/order-status";

export const toneClass: Record<Nada, string> = {
  warning: "text-warning bg-warning-bg",
  info: "text-info bg-info-bg",
  success: "text-success bg-success-bg",
  danger: "text-danger bg-danger-bg",
  neutral: "text-ink-muted bg-subtle",
};

export const toneIcon: Record<Nada, LucideIcon> = {
  warning: TriangleAlert,
  info: Info,
  success: CheckCircle2,
  danger: CircleAlert,
  neutral: Info,
};
