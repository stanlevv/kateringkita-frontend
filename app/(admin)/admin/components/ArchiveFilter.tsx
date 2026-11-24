// Komponen ArchiveFilter: dua pil tautan "Aktif" dan "Arsip" di atas daftar promo, banner, dan pop-up admin.
// Pilihan disimpan di URL (?arsip=1), jadi halaman server bisa meminta daftar arsip ke backend (?archived=true).
import Link from "next/link";
import { cx, focusRing } from "@/app/components/ui/cx";

// Gaya pil, sama dengan filter di halaman moderasi; pil yang aktif berwarna utama.
const pillClass = (active: boolean) =>
  cx(
    "inline-flex min-h-11 items-center rounded-md border px-4 font-medium",
    focusRing,
    active ? "border-primary bg-primary text-surface" : "border-line-strong bg-surface text-ink hover:bg-subtle",
  );

/**
 * Filter tampilan konten yang tidak diarsipkan atau yang diarsipkan.
 * @param props.path alamat halaman, mis. "/admin/popup"
 * @param props.archived true bila tampilan Arsip sedang dibuka
 * @returns nav berisi dua pil tautan
 */
export function ArchiveFilter({ path, archived }: { path: string; archived: boolean }) {
  return (
    <nav aria-label="Filter arsip" className="flex flex-wrap gap-2">
      <Link href={path} aria-current={archived ? undefined : "true"} className={pillClass(!archived)}>
        Aktif
      </Link>
      <Link href={`${path}?arsip=1`} aria-current={archived ? "true" : undefined} className={pillClass(archived)}>
        Arsip
      </Link>
    </nav>
  );
}
