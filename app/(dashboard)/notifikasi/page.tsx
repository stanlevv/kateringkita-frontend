import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { requireMerchant } from "@/services/auth.service";
import { getNotifications } from "@/services/notification.service";
import { DaftarNotifikasi } from "./DaftarNotifikasi";

// Notifikasi penjual: pengumuman admin, foto menu yang dihapus admin, dll. Dibuka = semua ditandai dibaca.
export default async function NotifikasiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireMerchant();
  const q = await searchParams;
  const n = typeof q.page === "string" && /^\d{1,5}$/.test(q.page) ? Number(q.page) : 1;
  const page = Math.max(1, n);
  const r = await getNotifications(page);
  return (
    <PageHeader title="Notifikasi" description="Pengumuman dari admin dan kabar tentang toko kamu.">
      {"error" in r ? (
        <GagalMuat
          judul="Notifikasi belum bisa dimuat"
          isi="Terjadi kesalahan saat mengambil notifikasi. Periksa koneksi lalu coba lagi."
        />
      ) : (
        <DaftarNotifikasi rows={r.data.rows} total={r.data.total} page={page} unread={r.data.unread} />
      )}
    </PageHeader>
  );
}
