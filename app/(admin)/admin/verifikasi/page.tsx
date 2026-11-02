import { VerificationQueue } from "@/components/admin/VerificationQueue";
import { GagalMuat } from "@/components/dashboard/GagalMuat";
import { PageHeader } from "@/components/shell/PageHeader";
import { adminFetch } from "@/lib/admin/api";
import type { AntrianPenjual } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/session";

// A-05 — Antrean verifikasi penjual.
export default async function VerifikasiPage() {
  await requireAdmin();
  const res = await adminFetch<AntrianPenjual[]>("/verification-queue");
  return (
    <PageHeader title="Verifikasi penjual" description="Periksa toko baru atau yang sudah diperbaiki. Yang paling lama menunggu ada di atas.">
      {res.ok && res.data ? <VerificationQueue rows={res.data} /> : <GagalMuat judul="Antrean belum bisa dimuat" isi="Terjadi kesalahan saat mengambil antrean. Periksa koneksi lalu coba lagi." />}
    </PageHeader>
  );
}
