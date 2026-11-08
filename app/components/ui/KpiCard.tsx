import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

export function KpiCard({ label, value, hint, icon: Icon, children }: { label: string; value: ReactNode; hint?: string; icon?: LucideIcon; children?: ReactNode }) {
  return (
    <Card>
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        {Icon && <Icon aria-hidden className="size-4" />}
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold text-ink">{value}</p>
      {children}
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </Card>
  );
}
