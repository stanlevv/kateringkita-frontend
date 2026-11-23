import { SearchX } from "lucide-react";
import { LoadError } from "@/app/components/LoadError";
import { MenuForm } from "@/app/(dashboard)/menu/components/MenuForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { getMenu } from "@/services/menu.service";
import { getCategories } from "@/services/meta.service";
import { requireMerchant } from "@/services/auth.service";

// M-07, MF-N2 — Ubah menu. MF-E5: id tidak ada ditampilkan di halaman ini, bukan 404 global.
export default async function EditMenuPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMerchant();
  const { id } = await params;
  const [menu, categories] = await Promise.all([/^\d{1,9}$/.test(id) ? getMenu(Number(id)) : null, getCategories()]);
  const menuMissing = !menu || ("error" in menu && menu.error.code === "NOT_FOUND");
  return (
    <PageHeader title="Ubah menu">
      {menuMissing ? (
        <EmptyState
          icon={SearchX}
          title="Menu tidak ditemukan"
          body="Menu ini tidak ada atau sudah dihapus."
          action={<LinkButton href="/menu">Kembali ke daftar menu</LinkButton>}
        />
      ) : "error" in menu || "error" in categories ? (
        <LoadError title="Formulir menu belum bisa dimuat" body="Data menu gagal dimuat. Coba lagi." />
      ) : (
        <MenuForm key={menu.data.id} categories={categories.data} menu={menu.data} />
      )}
    </PageHeader>
  );
}
