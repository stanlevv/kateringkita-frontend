import { SearchX } from "lucide-react";
import { GagalMuat } from "@/app/components/GagalMuat";
import { MenuForm } from "@/app/(dashboard)/menu/components/MenuForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { getMenu } from "@/services/menuService";
import { getCategories } from "@/services/metaService";
import { requireMerchant } from "@/services/authService";

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
