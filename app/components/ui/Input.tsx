// Komponen isian form bergaya seragam: Input, Textarea, dan Select. Biasanya dibungkus Field agar punya label.
import type { ComponentProps, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cx, focusRing } from "./cx";

// Gaya bersama; bingkai merah otomatis saat `aria-invalid=true` (dipasang Field bila ada galat).
const baseClass =
  "w-full rounded-md border border-line-strong bg-surface px-3 text-ink placeholder:text-ink-muted aria-[invalid=true]:border-danger disabled:bg-subtle disabled:text-ink-muted";

/**
 * Kotak isian satu baris setinggi 44 px.
 * @param props atribut `input` biasa
 * @returns elemen `input`
 */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx(baseClass, "min-h-11", focusRing, className)} />;
}

/**
 * Kotak isian banyak baris.
 * @param props atribut `textarea` biasa
 * @returns elemen `textarea`
 */
export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea {...rest} className={cx(baseClass, "min-h-24 py-2", focusRing, className)} />;
}

/**
 * Daftar pilihan.
 * @param props atribut `select` biasa (isi `option` lewat children)
 * @returns elemen `select`
 */
export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={cx(baseClass, "min-h-11", focusRing, className)} />;
}
