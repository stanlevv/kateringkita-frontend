// Satu bagian berjudul pada halaman pengaturan toko. Dipakai SettingsForm.tsx.
import type { ReactNode } from "react";
import { cx } from "@/app/components/ui/cx";

/**
 * Satu bagian berjudul. Judul bisa menerima fokus agar bagian yang dituju ?lengkapi= dibacakan pembaca layar.
 * @param props.id id bagian (juga #hash tautan)
 * @param props.title judul bagian
 * @param props.highlighted true = diberi cincin sorot sementara
 * @param props.children isi bagian
 * @returns elemen section
 */
export function Section({
  id,
  title,
  highlighted,
  children,
}: {
  id: string;
  title: string;
  highlighted: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-judul`}
      className={cx(
        "flex scroll-mt-24 flex-col gap-4 rounded-lg border border-line bg-surface p-4 transition-shadow duration-200 motion-reduce:transition-none sm:p-6",
        highlighted && "ring-2 ring-info",
      )}
    >
      <h2 id={`${id}-judul`} tabIndex={-1} className="text-lg font-semibold text-ink outline-none">
        {title}
      </h2>
      {children}
    </section>
  );
}
