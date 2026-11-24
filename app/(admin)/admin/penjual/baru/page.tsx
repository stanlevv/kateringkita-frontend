// Halaman /admin/penjual/baru: form tambah penjual (akun pemilik + toko). Hanya admin super dan ops.
// Server component: mengambil daftar jenis usaha dari GET /meta/merchant-types.
import { MerchantCreateForm } from "@/app/(admin)/admin/components/MerchantForms";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { apiFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";

/**
 * Tambah penjual. Toko baru berstatus "menunggu verifikasi", sama dengan pendaftaran biasa.
 * @returns halaman berisi form tambah penjual
 */
export default async function NewMerchantPage() {
  await requireAdmin("super", "ops");
  const merchantTypes = await apiFetch<{ id: number; name: string }[]>("/meta/merchant-types");
  return (
    <PageHeader
      title="Tambah penjual"
      description="Buat akun pemilik dan tokonya. Toko mulai berstatus menunggu verifikasi."
      actions={
        <LinkButton href="/admin/penjual" variant="secondary">
          Semua penjual
        </LinkButton>
      }
    >
      {merchantTypes.ok && merchantTypes.data ? (
        <MerchantCreateForm merchantTypes={merchantTypes.data} />
      ) : (
        <LoadError title="Jenis usaha belum bisa dimuat" body="Periksa koneksi lalu coba lagi." />
      )}
    </PageHeader>
  );
}
