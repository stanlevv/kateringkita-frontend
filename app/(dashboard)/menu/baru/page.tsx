// Halaman /menu/baru: formulir tambah menu.
// Server component: mengambil daftar kategori (getCategories) di server dan membaca searchParams (parameter URL).
import { LoadError } from "@/app/components/LoadError";
import { MenuForm } from "@/app/(dashboard)/menu/components/MenuForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getCategories } from "@/services/meta.service";
import { requireMerchant } from "@/services/auth.service";

/** Bilangan bulat 1–9 digit dari parameter URL; selain itu undefined. */
const parseWholeNumber = (value: string | string[] | undefined) =>
  typeof value === "string" && /^\d{1,9}$/.test(value) ? Number(value) : undefined;

/**
 * Halaman tambah menu. Kalkulator HPP membuka halaman ini dengan `?hpp=&price=` supaya harga sudah terisi.
 * HPP = harga pokok produksi, yaitu modal per porsi.
 * @param props.searchParams parameter URL: `hpp` dan `price` (opsional)
 * @returns PageHeader berisi MenuForm, atau layar gagal muat bila kategori gagal diambil
 */
export default async function NewMenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 1. Pastikan penjual sudah masuk, lalu ambil kategori dan parameter URL sekaligus.
  await requireMerchant();
  const [categories, query] = await Promise.all([getCategories(), searchParams]);
  return (
    <PageHeader title="Tambah menu">
      {"error" in categories ? (
        <LoadError title="Formulir menu belum bisa dimuat" body="Daftar kategori gagal dimuat. Coba lagi." />
      ) : (
        <MenuForm
          categories={categories.data}
          prefill={{ hpp: parseWholeNumber(query.hpp), price: parseWholeNumber(query.price) }}
        />
      )}
    </PageHeader>
  );
}
