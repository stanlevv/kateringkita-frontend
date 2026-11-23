// Komponen PageHeader: judul, deskripsi, dan tombol aksi di atas setiap halaman panel. Dipakai hampir semua page.tsx.
import type { ReactNode } from "react";

/**
 * Kepala halaman (h1 + deskripsi + aksi), lalu isi halaman.
 * @param props.title judul halaman (h1)
 * @param props.description deskripsi di bawah judul
 * @param props.actions tombol/tautan di kanan
 * @param props.children isi halaman
 * @returns fragmen berisi kepala dan isi
 */
export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          {description && <p className="mt-1 text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </>
  );
}
