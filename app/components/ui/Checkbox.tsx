// Komponen Checkbox: kotak centang dengan label yang bisa diklik (area sentuh 44 px). Dipakai PickupPointPicker.
import type { InputHTMLAttributes } from "react";
import { cx, focusRing } from "./cx";

/**
 * Kotak centang berlabel.
 * @param props.label teks di samping kotak
 * @param props atribut `input` lain (checked, onChange, name, ...)
 * @returns elemen `label` berisi `input type="checkbox"`
 */
export function Checkbox({
  label,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-ink">
      <input type="checkbox" {...rest} className={cx("size-5 accent-primary", focusRing, className)} />
      {label}
    </label>
  );
}
