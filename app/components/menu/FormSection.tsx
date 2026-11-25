// Satu bagian formulir menu berjudul. Dipakai MenuForm.tsx.
import type { ReactNode } from "react";

/** Satu bagian formulir berjudul (Info dasar, Foto, Harga, ...). */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}
