import { GagalMuat } from "@/components/dashboard/GagalMuat";
import { SummaryCards } from "@/components/admin/SummaryCards";
import { PageHeader } from "@/components/shell/PageHeader";
import { adminFetch } from "@/lib/admin/api";
import type { Ringkasan } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/session";

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
