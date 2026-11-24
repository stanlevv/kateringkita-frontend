// Halaman /admin/penjual/<id>: detail satu penjual (profil, pemilik, checklist, aksi admin, log toko).
// Server component: mengambil detail lewat adminFetch (GET /admin/merchants/<id>), lalu menyerahkannya ke MerchantDetail.
import { SearchX } from "lucide-react";
import { MerchantDetail } from "@/app/(admin)/admin/components/MerchantDetail";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { adminFetch } from "@/services/api";
import type { AdminMerchantDetail } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

/**
 * Halaman detail penjual. Id yang bukan angka tidak dikirim ke backend dan langsung tampil "Penjual tidak ditemukan",
 * sama seperti jawaban 404 dari backend.
 * @param props.params parameter route: `id` dari folder [id] di URL
 * @returns PageHeader berisi MerchantDetail, keadaan kosong "tidak ditemukan", atau LoadError
 */
export default async function MerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Pastikan yang membuka adalah admin, lalu siapkan tampilan "tidak ditemukan" yang dipakai dua kali.
  await requireAdmin();
  const { id } = await params;
  const merchantNotFound = (
    <EmptyState
      icon={SearchX}
      title="Penjual tidak ditemukan"
      body="Penjual ini tidak ada atau sudah dihapus."
      action={
        <LinkButton href="/admin/penjual" variant="secondary">
          Kembali ke daftar penjual
        </LinkButton>
      }
    />
  );
  // 2. Id harus bilangan bulat positif; selain itu tidak perlu bertanya ke backend.
  if (!/^[1-9]\d{0,9}$/.test(id)) return merchantNotFound;
  // 3. Ambil detail; 404 = tidak ditemukan, galat lain = LoadError.
  const response = await adminFetch<AdminMerchantDetail>(`/merchants/${id}`);
  if (response.status === 404) return merchantNotFound;
  if (!response.ok || !response.data)
    return (
      <LoadError
        title="Penjual belum bisa dimuat"
        body="Terjadi kesalahan saat mengambil data penjual. Periksa koneksi lalu coba lagi."
      />
    );
  return (
    <PageHeader
      title={response.data.business_name}
      actions={
        <LinkButton href="/admin/penjual" variant="secondary">
          Semua penjual
        </LinkButton>
      }
    >
      <MerchantDetail merchant={response.data} />
    </PageHeader>
  );
}
