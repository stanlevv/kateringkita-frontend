import { LoadError } from "@/app/components/LoadError";
import { MenuForm } from "@/app/(dashboard)/menu/components/MenuForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getCategories } from "@/services/meta.service";
import { requireMerchant } from "@/services/auth.service";

const parseWholeNumber = (value: string | string[] | undefined) =>
  typeof value === "string" && /^\d{1,9}$/.test(value) ? Number(value) : undefined;

// M-07, MF-N1 — Tambah menu. `?hpp=&price=` dari Kalkulator HPP (HP-N2).
export default async function NewMenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
