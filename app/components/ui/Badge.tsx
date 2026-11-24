// Komponen Badge: label kecil berwarna dengan ikon. Dasar StatusBadge dan PaymentBadge; dipakai juga di tabel admin.
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/order-status";
import { cx } from "./cx";
import { toneClass } from "./tone";

/**
 * Label kecil berwarna sesuai nada, selalu dengan ikon agar tidak hanya mengandalkan warna.
 * @param props.tone nada warna (warning, info, success, danger, neutral)
 * @param props.icon ikon lucide di depan teks
 * @param props.children teks label
 * @returns elemen `span`
 */
export function Badge({ tone, icon: Icon, children }: { tone: Tone; icon: LucideIcon; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium", toneClass[tone])}>
      <Icon aria-hidden className="size-4" />
      {children}
    </span>
  );
}
