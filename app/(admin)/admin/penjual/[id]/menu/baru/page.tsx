// Halaman /admin/penjual/[id]/menu/baru: tambah menu atas nama toko. Memakai MenuForm milik penjual dengan server
// action admin (saveMerchantMenu) dan tanpa unggah foto. Hanya admin super dan ops.
import { MenuForm } from "@/app/components/menu/MenuForm";
import { saveMerchantMenu } from "@/app/actions/admin/merchant-edit";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getCategories } from "@/services/meta.service";
import { requireAdmin } from "@/services/auth.service";

/**
 * Tambah menu toko.
 * @param props.params `id` toko dari URL
 * @returns halaman berisi MenuForm
 */
export default async function NewMerchantMenuPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("super", "ops");
  const { id } = await params;
  const merchantId = /^[1-9]\d{0,9}$/.test(id) ? Number(id) : 0;
  const categories = await getCategories();
  return (
    <PageHeader title="Tambah menu toko">
      {merchantId && "data" in categories ? (
        <MenuForm
          categories={categories.data}
          save={saveMerchantMenu.bind(null, merchantId)}
          doneHref={`/admin/penjual/${merchantId}/menu`}
          canUploadPhoto={false}
        />
      ) : (
        <LoadError title="Formulir menu belum bisa dimuat" body="Kembali ke daftar menu lalu coba lagi." />
      )}
    </PageHeader>
  );
}
