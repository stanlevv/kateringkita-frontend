import type { ComponentProps, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cx, focusRing } from "./cx";

const baseClass =
  "w-full rounded-md border border-line-strong bg-surface px-3 text-ink placeholder:text-ink-muted aria-[invalid=true]:border-danger disabled:bg-subtle disabled:text-ink-muted";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx(baseClass, "min-h-11", focusRing, className)} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea {...rest} className={cx(baseClass, "min-h-24 py-2", focusRing, className)} />;
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={cx(baseClass, "min-h-11", focusRing, className)} />;
}
