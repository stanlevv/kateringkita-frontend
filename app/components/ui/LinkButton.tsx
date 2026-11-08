import Link from "next/link";
import type { ComponentProps } from "react";
import { cx, fokus } from "./cx";

const varian = {
  primary: "bg-primary text-surface hover:bg-primary-pressed",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-subtle",
};

// Tautan bergaya tombol (navigasi, bukan aksi).
export function LinkButton({ variant = "primary", size = "md", className, ...rest }: ComponentProps<typeof Link> & { variant?: keyof typeof varian; size?: "md" | "lg" }) {
  return (
    <Link
      {...rest}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 font-medium transition-colors motion-reduce:transition-none",
        size === "lg" && "min-h-12 px-6 text-lg",
        varian[variant],
        fokus,
        className,
      )}
    />
  );
}
