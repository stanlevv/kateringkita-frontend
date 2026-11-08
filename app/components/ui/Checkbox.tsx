import type { InputHTMLAttributes } from "react";
import { cx, fokus } from "./cx";

export function Checkbox({ label, className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-ink">
      <input type="checkbox" {...rest} className={cx("size-5 accent-primary", fokus, className)} />
      {label}
    </label>
  );
}
