import { GagalMuat } from "@/app/components/GagalMuat";
import { MenuForm } from "@/app/(dashboard)/menu/components/MenuForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getCategories } from "@/services/metaService";
import { requireMerchant } from "@/services/authService";

const bulat = (v: string | string[] | undefined) => (typeof v === "string" && /^\d{1,9}$/.test(v) ? Number(v) : undefined);

// M-07, MF-N1 — Tambah menu. `?hpp=&price=` dari Kalkulator HPP (HP-N2).
export default async function MenuBaruPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireMerchant();
  const [kategori, q] = await Promise.all([getCategories(), searchParams]);
  return (
    <PageHeader title="Tambah menu">
      {"error" in kategori ? <GagalMuat judul="Formulir menu belum bisa dimuat" isi="Daftar kategori gagal dimuat. Coba lagi." /> : <MenuForm categories={kategori.data} prefill={{ hpp: bulat(q.hpp), price: bulat(q.price) }} />}
    </PageHeader>
  );
}
