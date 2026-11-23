// Halaman /menu: katalog menu penjual (cari, kategori, tab status, kuota, aktif/nonaktif).
// Server component: mengambil daftar menu (getMenus) dan kategori (getCategories) di server, lalu menyerahkannya ke
// MenuCatalog.
import { Suspense } from "react";
import { MenuCatalog } from "@/app/(dashboard)/menu/components/MenuCatalog";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { getCategories } from "@/services/meta.service";
import { getMenus } from "@/services/menu.service";
import { requireMerchant } from "@/services/auth.service";

/**
 * Halaman katalog menu. Bila data gagal diambil, MenuCatalog yang menampilkan layar gagal muat.
 * @returns PageHeader dengan tombol Tambah menu, berisi MenuCatalog. Suspense dibutuhkan karena MenuCatalog membaca
 * URL di klien (useSearchParams).
 */
export default async function MenuPage() {
  // 1. Pastikan penjual sudah masuk, lalu ambil menu dan kategori sekaligus.
  await requireMerchant();
  const [menus, categories] = await Promise.all([getMenus(), getCategories()]);
  const loadFailed = "error" in menus || "error" in categories;
  return (
    <PageHeader title="Menu & Stok" actions={<LinkButton href="/menu/baru">Tambah menu</LinkButton>}>
      <Suspense>
        <MenuCatalog
          menus={"data" in menus ? menus.data : []}
          categories={"data" in categories ? categories.data : []}
          loadFailed={loadFailed}
        />
      </Suspense>
    </PageHeader>
  );
}
