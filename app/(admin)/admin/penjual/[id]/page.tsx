// Halaman /admin/penjual/<id>: detail satu penjual (profil, pemilik, checklist, aksi admin, log toko).
// Server component: mengambil detail lewat adminFetch (GET /admin/merchants/<id>), lalu menyerahkannya ke MerchantDetail.
import { SearchX } from "lucide-react";
import { AccountStatusToggle } from "@/app/(admin)/admin/components/AccountStatusToggle";
import { MerchantDetail } from "@/app/(admin)/admin/components/MerchantDetail";
import { MerchantManageForms } from "@/app/(admin)/admin/components/MerchantForms";
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
  const { user } = await requireAdmin();
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
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/admin/penjual" variant="secondary">
            Semua penjual
          </LinkButton>
          <LinkButton href={`/admin/penjual/${id}/menu`} variant="secondary">
            Menu toko
          </LinkButton>
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        <AccountStatusToggle
          kind="merchant"
          id={response.data.id}
          active={response.data.owner.is_active}
          canEdit={user.admin_level !== "support"}
        />
        <MerchantDetail merchant={response.data} />
        {user.admin_level !== "support" && (
          <section
            aria-label="Kelola penjual"
            className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold text-ink">Kelola penjual</h2>
            <MerchantManageForms
              merchantId={response.data.id}
              store={{
                business_name: response.data.business_name,
                address: response.data.address,
                wa_number: response.data.wa_number,
                description: response.data.description ?? "",
              }}
              owner={{
                full_name: response.data.owner.full_name,
                phone: response.data.owner.phone,
                email: response.data.owner.email ?? "",
              }}
            />
          </section>
        )}
      </div>
    </PageHeader>
  );
}
