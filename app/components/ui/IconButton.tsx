// Komponen IconButton: tombol berisi ikon saja, dengan label untuk pembaca layar dan tooltip. Dipakai Dialog, Toast,
// shell.
import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cx, focusRing } from "./cx";

/**
 * Tombol ikon 44×44 px. `label` dipasang sebagai `aria-label` (nama tombol untuk pembaca layar) dan `title`.
 * @param props.icon ikon lucide
 * @param props.label nama tombol
 * @param props atribut `button` lain (onClick, disabled, ...)
 * @returns elemen `button`
 */
export function IconButton({
  icon: Icon,
  label,
  className,
  type = "button",
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { icon: LucideIcon; label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      {...rest}
      className={cx(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink hover:bg-subtle disabled:opacity-50",
        focusRing,
        className,
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
