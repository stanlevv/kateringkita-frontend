// Komponen SyncBanner: banner "Koneksi terputus" di dashboard. Dipakai DashboardLive.
import { Banner } from "@/app/components/ui/Banner";
import { formatTime } from "@/lib/format";

/**
 * Banner saat sinkron gagal atau peramban offline; data lama tetap tampil dan sinkron terus dicoba.
 * @param props.lastSyncedAt waktu sinkron sukses terakhir (ms)
 * @returns Banner peringatan
 */
export function SyncBanner({ lastSyncedAt }: { lastSyncedAt: number }) {
  return (
    <Banner tone="warning">
      Koneksi terputus — data terakhir {formatTime(new Date(lastSyncedAt).toISOString())}. Mencoba lagi…
    </Banner>
  );
}
