// Komponen PageFrame: kerangka memuat satu halaman (judul asli + isi kerangka). Dipakai semua file loading.tsx.
// loading.tsx = file khusus Next.js yang tampil otomatis selama halaman server menunggu data.
import type { ReactNode } from "react";
import { SkeletonText } from "@/app/components/ui/Skeleton";
import { PageHeader } from "./PageHeader";

/**
 * Kerangka satu halaman. Judul & deskripsi statis langsung tampil memakai PageHeader asli, jadi saat data datang
 * hanya isinya yang berganti. Tanpa `title` (judul dari data, mis. kode pesanan) judulnya ikut dikerangkakan.
 * Kerangka baru muncul setelah 150 ms (animate-muncul) supaya perpindahan yang cepat tidak berkedip; `actions` ikut
 * tertunda. Judul/deskripsi harus sama persis dengan halamannya (dijaga test/page-skeleton.test.ts).
 * @param props.title judul halaman (opsional)
 * @param props.description deskripsi halaman (opsional)
 * @param props.actions tombol di kanan judul (opsional)
 * @param props.children isi kerangka (komponen Skeleton*)
 * @returns PageHeader atau judul kerangka, dibungkus role="status" ("Memuat ..." untuk pembaca layar)
 */
export function PageFrame({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  // 1. Bungkus isi dengan role="status" + aria-label "Memuat ..." dan animasi muncul tertunda.
  const wrapStatus = (content: ReactNode) => (
    <div
      role="status"
      aria-label={`Memuat ${title ?? "halaman"}`}
      className="animate-muncul motion-reduce:animate-none"
    >
      {content}
    </div>
  );
  // 2. Ada judul: pakai PageHeader asli. 3. Tanpa judul: judul ikut berupa kerangka.
  if (title) {
    const delayedActions = actions && (
      <div className="flex animate-muncul items-center gap-2 motion-reduce:animate-none">{actions}</div>
    );
    return (
      <PageHeader title={title} description={description} actions={delayedActions}>
        {wrapStatus(children)}
      </PageHeader>
    );
  }
  return wrapStatus(
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <SkeletonText size="2xl" width="w-56" />
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </>,
  );
}
