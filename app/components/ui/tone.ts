// Warna dan ikon per nada (tone: warning, info, success, danger, neutral) yang dipakai Badge, Banner, dan Toast.
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { Tone } from "@/lib/order-status";

/** Kelas warna teks + latar untuk tiap nada. */
export const toneClass: Record<Tone, string> = {
  warning: "text-warning bg-warning-bg",
  info: "text-info bg-info-bg",
  success: "text-success bg-success-bg",
  danger: "text-danger bg-danger-bg",
  neutral: "text-ink-muted bg-subtle",
};

/** Ikon lucide untuk tiap nada (warna tidak boleh jadi satu-satunya penanda). */
export const toneIcon: Record<Tone, LucideIcon> = {
  warning: TriangleAlert,
  info: Info,
  success: CheckCircle2,
  danger: CircleAlert,
  neutral: Info,
};
