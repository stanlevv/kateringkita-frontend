import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-strong px-6 py-12 text-center">
      <Icon aria-hidden className="size-10 text-ink-muted" />
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-sm text-ink-muted">{body}</p>
      {action}
    </div>
  );
}
