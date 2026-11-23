import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { requireMerchant } from "@/services/auth.service";
import { getNotifications } from "@/services/notification.service";
import { NotificationList } from "./NotificationList";

// Notifikasi penjual: pengumuman admin, foto menu yang dihapus admin, dll. Dibuka = semua ditandai dibaca.
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
