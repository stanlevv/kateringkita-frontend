import { Banner } from "@/components/ui/Banner";
import { formatJam } from "@/lib/format";

/** DB-E5: penyegaran gagal atau peramban offline; `terakhir` = waktu penyegaran sukses terakhir. */
export function SyncBanner({ terakhir }: { terakhir: number }) {
  return <Banner tone="warning">Koneksi terputus — data terakhir {formatJam(new Date(terakhir).toISOString())}. Mencoba lagi…</Banner>;
}
