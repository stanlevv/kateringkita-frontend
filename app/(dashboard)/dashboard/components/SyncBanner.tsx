import { Banner } from "@/app/components/ui/Banner";
import { formatTime } from "@/lib/format";

/** DB-E5: penyegaran gagal atau peramban offline; `terakhir` = waktu penyegaran sukses terakhir. */
export function SyncBanner({ lastSyncedAt }: { lastSyncedAt: number }) {
  return (
    <Banner tone="warning">
      Koneksi terputus — data terakhir {formatTime(new Date(lastSyncedAt).toISOString())}. Mencoba lagi…
    </Banner>
  );
}
