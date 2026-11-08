import { GagalMuat } from "@/app/components/GagalMuat";
import { SummaryCards } from "@/app/(admin)/admin/components/SummaryCards";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import type { Ringkasan } from "@/types/admin";
import { requireAdmin } from "@/services/authService";

// A-04 — Ringkasan platform. Penjaga dipanggil di sini juga: layout tidak dijalankan ulang saat navigasi klien.
export default async function AdminPage() {
  await requireAdmin();
  const res = await adminFetch<Ringkasan>("/summary");
  return (
    <PageHeader title="Ringkasan" description="Kondisi platform hari ini (WIB).">
      {res.ok && res.data ? (
        <SummaryCards data={res.data} />
      ) : (
        <GagalMuat judul="Ringkasan belum bisa dimuat" isi="Terjadi kesalahan saat mengambil data platform. Periksa koneksi lalu coba lagi." />
      )}
    </PageHeader>
  );
}
