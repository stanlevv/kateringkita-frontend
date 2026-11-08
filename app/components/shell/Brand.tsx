import { ChefHat } from "lucide-react";
import { cx } from "@/app/components/ui/cx";

export function Brand({ rail = false }: { rail?: boolean }) {
  return (
    <div className={cx("flex items-center gap-2", rail && "justify-center xl:justify-start")}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-surface">
        <ChefHat aria-hidden className="size-5" />
      </span>
      <span className={cx("text-lg font-bold tracking-tight text-ink", rail && "hidden xl:inline")}>
        Katering<span className="text-primary">Kita</span>
      </span>
    </div>
  );
}
