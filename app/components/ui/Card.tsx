// Komponen Card: kotak berbingkai dasar untuk mengelompokkan isi. Dipakai KpiCard, Skeleton, dan banyak halaman.
import type { HTMLAttributes } from "react";
import { cx } from "./cx";

/**
 * Kotak berbingkai dengan padding standar.
 * @param props atribut `div` biasa; `className` ditambahkan ke gaya bawaan
 * @returns elemen `div`
 */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx("rounded-lg border border-line bg-surface p-4", className)} />;
}
