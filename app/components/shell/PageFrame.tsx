import type { ReactNode } from "react";
import { SkeletonText } from "@/app/components/ui/Skeleton";
import { PageHeader } from "./PageHeader";

/**
 * Kerangka satu halaman (SY-3). Judul & deskripsi statis langsung tampil memakai PageHeader asli, jadi saat data
 * datang hanya isinya yang berganti. Tanpa `judul` (judul dari data, mis. kode pesanan) judulnya ikut dikerangkakan.
 * Kerangka baru muncul setelah 150 ms (animate-muncul) supaya perpindahan yang cepat tidak berkedip; `aksi` ikut tertunda.
 * Judul/deskripsi harus sama persis dengan halamannya (dijaga test/rangka.test.ts).
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
  const wrapStatus = (content: ReactNode) => (
    <div
      role="status"
      aria-label={`Memuat ${title ?? "halaman"}`}
      className="animate-muncul motion-reduce:animate-none"
    >
      {content}
    </div>
  );
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
