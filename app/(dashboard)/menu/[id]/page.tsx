import { SearchX } from "lucide-react";
import { GagalMuat } from "@/components/dashboard/GagalMuat";
import { MenuForm } from "@/components/menu/MenuForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getMenu } from "@/lib/data/menus";
import { getCategories } from "@/lib/data/meta";
import { requireMerchant } from "@/lib/session";

// M-07, MF-N2 — Ubah menu. MF-E5: id tidak ada ditampilkan di halaman ini, bukan 404 global.
export default async function UbahMenuPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMerchant();
  const { id } = await params;
  const [menu, kategori] = await Promise.all([/^\d{1,9}$/.test(id) ? getMenu(Number(id)) : null, getCategories()]);
  const hilang = !menu || ("error" in menu && menu.error.code === "NOT_FOUND");
  return (
    <PageHeader title="Ubah menu">
      {hilang ? (
        <EmptyState icon={SearchX} title="Menu tidak ditemukan" body="Menu ini tidak ada atau sudah dihapus." action={<LinkButton href="/menu">Kembali ke daftar menu</LinkButton>} />
      ) : "error" in menu || "error" in kategori ? (
        <GagalMuat judul="Formulir menu belum bisa dimuat" isi="Data menu gagal dimuat. Coba lagi." />
      ) : (
        <MenuForm key={menu.data.id} categories={kategori.data} menu={menu.data} />
      )}
    </PageHeader>
  );
}
