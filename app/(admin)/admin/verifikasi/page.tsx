import { VerificationQueue } from "@/app/(admin)/admin/components/VerificationQueue";
import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import type { AntrianPenjual } from "@/types/admin";
import { requireAdmin } from "@/services/authService";

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
