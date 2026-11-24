// Halaman /admin/penjual/[id]/menu/[menuId]: ubah menu toko. Memakai MenuForm milik penjual dengan server action admin
// (saveMerchantMenu); foto lama dipertahankan, unggah foto baru tetap dari akun penjual. Hanya admin super dan ops.
import { MenuForm } from "@/app/(dashboard)/menu/components/MenuForm";
import { saveMerchantMenu } from "@/app/actions/admin/merchant-edit";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { getCategories } from "@/services/meta.service";
import { requireAdmin } from "@/services/auth.service";
import type { MerchantMenu } from "@/types/menu";

/**
 * Ubah menu toko.
 * @param props.params `id` toko dan `menuId` dari URL
 * @returns halaman berisi MenuForm, atau pesan gagal muat
 */
export default async function EditMerchantMenuPage({ params }: { params: Promise<{ id: string; menuId: string }> }) {
  await requireAdmin("super", "ops");
  const { id, menuId } = await params;
  const valid = /^[1-9]\d{0,9}$/.test(id) && /^[1-9]\d{0,9}$/.test(menuId);
  const [menu, categories] = await Promise.all([
    valid ? adminFetch<MerchantMenu>(`/merchants/${id}/menus/${menuId}`) : null,
    getCategories(),
  ]);
  return (
    <PageHeader title="Ubah menu toko">
      {menu?.ok && menu.data && "data" in categories ? (
        <MenuForm
          key={menu.data.id}
          categories={categories.data}
          menu={menu.data}
          save={saveMerchantMenu.bind(null, Number(id))}
          doneHref={`/admin/penjual/${id}/menu`}
          canUploadPhoto={false}
        />
      ) : (
        <LoadError
          title={menu?.status === 404 || !menu ? "Menu tidak ditemukan" : "Formulir menu belum bisa dimuat"}
          body="Kembali ke daftar menu lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
