import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cx, fokus } from "./cx";

export function IconButton({ icon: Icon, label, className, type = "button", ...rest }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { icon: LucideIcon; label: string }) {
  return (
    <button type={type} aria-label={label} title={label} {...rest} className={cx("inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink hover:bg-subtle disabled:opacity-50", fokus, className)}>
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
