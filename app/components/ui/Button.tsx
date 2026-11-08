import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cx, fokus } from "./cx";

const varian = {
  primary: "bg-primary text-surface hover:bg-primary-pressed",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-subtle",
  ghost: "text-ink hover:bg-subtle",
  danger: "bg-danger text-surface hover:opacity-90",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof varian;
  size?: "md" | "lg";
  loading?: boolean;
  loadingText?: string;
};

export function Button({ variant = "primary", size = "md", loading, loadingText, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 font-medium transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50",
        size === "lg" && "min-h-12 px-6 text-lg",
        varian[variant],
        fokus,
        className,
      )}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />}
      {loading ? (loadingText ?? children) : children}
    </button>
  );
}
