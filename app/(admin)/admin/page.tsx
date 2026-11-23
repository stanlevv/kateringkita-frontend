// Halaman /admin: ringkasan kondisi platform hari ini (pesanan per status, omzet, penjual per status, aksi admin
// terakhir). Server component: mengambil data lewat adminFetch (GET /admin/summary), lalu menyerahkannya ke SummaryCards.
import { LoadError } from "@/app/components/LoadError";
import { SummaryCards } from "@/app/(admin)/admin/components/SummaryCards";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import type { AdminSummary } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

/**
 * Halaman ringkasan admin. requireAdmin dipanggil lagi di sini, karena layout tidak dijalankan ulang saat admin
 * berpindah halaman di sisi klien.
 * @returns PageHeader berisi SummaryCards, atau LoadError bila data gagal dimuat
 */
export default async function AdminPage() {
  await requireAdmin();
  const response = await adminFetch<AdminSummary>("/summary");
  return (
    <PageHeader title="Ringkasan" description="Kondisi platform hari ini (WIB).">
      {response.ok && response.data ? (
        <SummaryCards data={response.data} />
      ) : (
        <LoadError
          title="Ringkasan belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil data platform. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
