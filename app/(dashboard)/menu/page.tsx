import { Suspense } from "react";
import { MenuCatalog } from "@/app/(dashboard)/menu/components/MenuCatalog";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { getCategories } from "@/services/meta.service";
import { getMenus } from "@/services/menu.service";
import { requireMerchant } from "@/services/auth.service";

// M-05, M-06 — Katalog menu (MN-*). Gagal muat ditangani MenuCatalog (MN-S3).
export default async function MenuPage() {
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
