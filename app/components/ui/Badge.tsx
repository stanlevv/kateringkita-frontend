import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Nada } from "@/lib/order-status";
import { cx } from "./cx";
import { toneClass } from "./tone";

export function Badge({ tone, icon: Icon, children }: { tone: Nada; icon: LucideIcon; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium", toneClass[tone])}>
      <Icon aria-hidden className="size-4" />
      {children}
    </span>
  );
}
