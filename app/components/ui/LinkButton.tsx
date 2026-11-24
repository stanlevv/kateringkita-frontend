// Komponen LinkButton: tautan Next.js yang tampil seperti tombol, untuk navigasi (bukan aksi). Dipakai di banyak
// halaman.
import Link from "next/link";
import type { ComponentProps } from "react";
import { cx, focusRing } from "./cx";

const variantClasses = {
  primary: "bg-accent text-ink hover:bg-accent-pressed",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-subtle",
};

/**
 * Tautan bergaya tombol (navigasi, bukan aksi).
 * @param props.variant gaya: primary (oranye) atau secondary (berbingkai)
 * @param props.size md (44 px) atau lg (48 px)
 * @param props atribut `Link` lain (href, ...)
 * @returns elemen `Link`
 */
export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: keyof typeof variantClasses; size?: "md" | "lg" }) {
  return (
    <Link
      {...rest}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 font-semibold transition-colors motion-reduce:transition-none",
        size === "lg" && "min-h-12 px-6 text-lg",
        variantClasses[variant],
        focusRing,
        className,
      )}
    />
  );
}
