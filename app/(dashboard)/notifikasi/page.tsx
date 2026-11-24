// Halaman /notifikasi: kotak masuk penjual (pengumuman admin, kabar foto menu yang dihapus admin, dan lainnya).
// Server component: membaca searchParams (?page=), mengambil satu halaman notifikasi dari backend lewat
// services/notification.service.ts (GET /me/notifications), lalu menyerahkannya ke NotificationList.
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { requireMerchant } from "@/services/auth.service";
import { getNotifications } from "@/services/notification.service";
import { NotificationList } from "./NotificationList";

/**
 * Halaman notifikasi. Membuka halaman ini menandai semua notifikasi sebagai sudah dibaca (dikerjakan NotificationList).
 * @param props.searchParams parameter URL: `page` (angka 1-5 digit; nilai lain dianggap halaman 1)
 * @returns PageHeader berisi NotificationList, atau LoadError bila gagal dimuat
 */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireMerchant();
  const params = await searchParams;
  const requestedPage = typeof params.page === "string" && /^\d{1,5}$/.test(params.page) ? Number(params.page) : 1;
  const page = Math.max(1, requestedPage);
  const result = await getNotifications(page);
  return (
    <PageHeader title="Notifikasi" description="Pengumuman dari admin dan kabar tentang toko kamu.">
      {"error" in result ? (
        <LoadError
          title="Notifikasi belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil notifikasi. Periksa koneksi lalu coba lagi."
        />
      ) : (
        <NotificationList rows={result.data.rows} total={result.data.total} page={page} unread={result.data.unread} />
      )}
    </PageHeader>
  );
}
