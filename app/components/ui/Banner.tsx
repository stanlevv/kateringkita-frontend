import type { ReactNode } from "react";
import type { Nada } from "@/lib/order-status";
import { cx } from "./cx";
import { toneClass, toneIcon } from "./tone";

export function Banner({ tone, children, action }: { tone: Nada; children: ReactNode; action?: ReactNode }) {
  const Icon = toneIcon[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx("flex flex-wrap items-center gap-3 rounded-md border border-line px-4 py-3", toneClass[tone])}>
      <Icon aria-hidden className="size-5 shrink-0" />
      <div className="flex-1 text-sm font-medium">{children}</div>
      {action}
    </div>
  );
}
