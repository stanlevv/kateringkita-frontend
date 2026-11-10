import type { ReactNode } from "react";
import { SkeletonTeks } from "@/app/components/ui/Skeleton";
import { PageHeader } from "./PageHeader";

/**
 * Kerangka satu halaman (SY-3). Judul & deskripsi statis langsung tampil memakai PageHeader asli, jadi saat data
 * datang hanya isinya yang berganti. Tanpa `judul` (judul dari data, mis. kode pesanan) judulnya ikut dikerangkakan.
 * Kerangka baru muncul setelah 150 ms (animate-muncul) supaya perpindahan yang cepat tidak berkedip; `aksi` ikut tertunda.
 * Judul/deskripsi harus sama persis dengan halamannya (dijaga test/rangka.test.ts).
 */
export function RangkaHalaman({ judul, deskripsi, aksi, children }: { judul?: string; deskripsi?: string; aksi?: ReactNode; children: ReactNode }) {
  const status = (isi: ReactNode) => (
    <div role="status" aria-label={`Memuat ${judul ?? "halaman"}`} className="animate-muncul motion-reduce:animate-none">
      {isi}
    </div>
  );
  if (judul) {
    const tunda = aksi && <div className="flex animate-muncul items-center gap-2 motion-reduce:animate-none">{aksi}</div>;
    return <PageHeader title={judul} description={deskripsi} actions={tunda}>{status(children)}</PageHeader>;
  }
  return status(
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <SkeletonTeks ukuran="2xl" lebar="w-56" />
        {aksi && <div className="flex items-center gap-2">{aksi}</div>}
      </div>
      {children}
    </>,
  );
}
