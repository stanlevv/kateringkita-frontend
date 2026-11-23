// Komponen Button: tombol aksi standar (primary, secondary, ghost, danger) dengan status memuat. Dipakai di semua form.
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cx, focusRing } from "./cx";

// Kelas warna tiap varian tombol.
const variantClasses = {
  // Oranye merek mobile; teks putih di atasnya hanya 2.8:1, jadi teks ink.
  primary: "bg-accent text-ink hover:bg-accent-pressed",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-subtle",
  ghost: "text-ink hover:bg-subtle",
  danger: "bg-danger text-surface hover:opacity-90",
};

/** Prop Button: atribut `button` biasa ditambah varian, ukuran, dan status memuat. */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClasses;
  size?: "md" | "lg";
  loading?: boolean;
  loadingText?: string;
};

/**
 * Tombol aksi. Saat `loading`, tombol nonaktif, `aria-busy` menyala (pembaca layar tahu sedang memproses),
 * ikon putar tampil, dan teks diganti `loadingText` bila ada.
 * @param props.variant gaya warna (bawaan primary)
 * @param props.size md (44 px) atau lg (48 px)
 * @param props.loading sedang memproses
 * @param props.loadingText teks selama memproses
 * @param props atribut `button` lain; `type` bawaan "button" agar tidak tak sengaja mengirim form
 * @returns elemen `button`
 */
export function Button({
  variant = "primary",
  size = "md",
  loading,
  loadingText,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 font-semibold transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50",
        size === "lg" && "min-h-12 px-6 text-lg",
        variantClasses[variant],
        focusRing,
        className,
      )}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />}
      {loading ? (loadingText ?? children) : children}
    </button>
  );
}
