// Halaman /menu/[id]: formulir ubah menu. [id] = id menu dari URL.
// Server component: mengambil menu (getMenu) dan kategori (getCategories) di server.
import { SearchX } from "lucide-react";
import { LoadError } from "@/app/components/LoadError";
import { MenuForm } from "@/app/(dashboard)/menu/components/MenuForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { getMenu } from "@/services/menu.service";
import { getCategories } from "@/services/meta.service";
import { requireMerchant } from "@/services/auth.service";

/**
 * Halaman ubah menu. Id yang bukan angka atau tidak ada ditampilkan di halaman ini sebagai "Menu tidak ditemukan"
 * (dengan tautan kembali), bukan halaman 404 umum.
 * @param props.params parameter rute: `id` (id menu)
 * @returns PageHeader berisi MenuForm, keadaan tidak ditemukan, atau layar gagal muat
 */
export default async function EditMenuPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Pastikan penjual sudah masuk. 2. Ambil menu hanya bila id berupa angka, bersamaan dengan kategori.
  await requireMerchant();
  const { id } = await params;
  const [menu, categories] = await Promise.all([/^\d{1,9}$/.test(id) ? getMenu(Number(id)) : null, getCategories()]);
  // 3. Tentukan tampilan: tidak ditemukan, gagal muat, atau formulir.
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
