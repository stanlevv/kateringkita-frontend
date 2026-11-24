// Halaman /admin (Dashboard): antrean yang menunggu admin ("Perlu tindakan"), lalu ringkasan kondisi platform hari ini
// (pesanan per status, omzet, penjual per status, aksi admin terakhir). Server component: mengambil GET /admin/summary
// dan GET /admin/queues (berbagi satu panggilan dengan layout lewat cache()), lalu menyerahkannya ke QueueTiles dan
// SummaryCards.
import { LoadError } from "@/app/components/LoadError";
import { QueueTiles } from "@/app/(admin)/admin/components/QueueTiles";
import { SummaryCards } from "@/app/(admin)/admin/components/SummaryCards";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getAdminQueues } from "@/services/admin-queue.service";
import { adminFetch } from "@/services/api";
import type { AdminSummary } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

/**
 * Halaman Dashboard admin. requireAdmin dipanggil lagi di sini, karena layout tidak dijalankan ulang saat admin
 * berpindah halaman di sisi klien.
 * @returns PageHeader berisi QueueTiles, lalu SummaryCards atau LoadError bila ringkasan gagal dimuat
 */
export default async function AdminPage() {
  await requireAdmin();
  const [response, queues] = await Promise.all([adminFetch<AdminSummary>("/summary"), getAdminQueues()]);
  return (
    <PageHeader title="Dashboard" description="Kondisi platform hari ini (WIB).">
      <div className="flex flex-col gap-6">
        <QueueTiles queues={queues} />
        {response.ok && response.data ? (
          <SummaryCards data={response.data} />
        ) : (
          <LoadError
            title="Ringkasan belum bisa dimuat"
            body="Terjadi kesalahan saat mengambil data platform. Periksa koneksi lalu coba lagi."
          />
        )}
      </div>
    </PageHeader>
  );
}
