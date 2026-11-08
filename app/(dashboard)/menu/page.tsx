import { Suspense } from "react";
import { MenuCatalog } from "@/app/(dashboard)/menu/components/MenuCatalog";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { getCategories } from "@/services/metaService";
import { getMenus } from "@/services/menuService";
import { requireMerchant } from "@/services/authService";

// M-05, M-06 — Katalog menu (MN-*). Gagal muat ditangani MenuCatalog (MN-S3).
export default async function MenuPage() {
  await requireMerchant();
  const [menus, kategori] = await Promise.all([getMenus(), getCategories()]);
  const galat = "error" in menus || "error" in kategori;
  return (
    <PageHeader title="Menu & Stok" actions={<LinkButton href="/menu/baru">Tambah menu</LinkButton>}>
      <Suspense>
        <MenuCatalog menus={"data" in menus ? menus.data : []} categories={"data" in kategori ? kategori.data : []} galat={galat} />
      </Suspense>
    </PageHeader>
  );
}
