// Halaman /admin/penjual: daftar semua penjual dengan pencarian, filter status verifikasi, dan filter dapur buka/tutup.
// Server component: membaca searchParams (?q=&status=&open=&page=, parameter di URL setelah tanda tanya), meneruskan
// yang sah ke adminFetch (GET /admin/merchants), lalu menyerahkan hasilnya ke MerchantTable.
import { Suspense } from "react";
import { MerchantTable } from "@/app/(admin)/admin/components/MerchantTable";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { LIMIT_MERCHANTS } from "@/services/admin-merchant.service";
import type { PageMeta, MerchantSummary } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

// Status verifikasi yang boleh dipakai sebagai filter ?status=.
const VALID_STATUSES = ["pending", "needs_fix", "verified", "suspended"];

/**
 * Halaman daftar penjual. Filter ada di URL, jadi bisa dibagikan dan tetap ada saat dimuat ulang. MerchantTable
 * dibungkus Suspense karena membaca useSearchParams di peramban.
 * @param props.searchParams parameter URL: `q` (kata cari), `status`, `open` ("1"/"0"), `page`
 * @returns PageHeader berisi MerchantTable, atau LoadError bila daftar gagal dimuat
 */
export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // 1. Pastikan yang membuka adalah admin, lalu baca parameter URL.
  await requireAdmin();
  const params = await searchParams;
  const apiQuery = new URLSearchParams();
  // 2. Saring nilai URL: yang tidak dikenal diabaikan agar tidak menjadi halaman galat.
  const search = params.q?.trim();
  const status = params.status && VALID_STATUSES.includes(params.status) ? params.status : undefined;
  const open = params.open === "1" || params.open === "0" ? params.open : undefined;
  if (search) apiQuery.set("q", search);
  if (status) apiQuery.set("status", status);
  if (open) apiQuery.set("open", open);
  // 3. Nomor halaman harus bilangan bulat 1–100.000; selain itu dianggap halaman 1.
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  apiQuery.set("page", String(page));
  apiQuery.set("limit", String(LIMIT_MERCHANTS));
  // 4. Ambil satu halaman penjual; jumlah total untuk paginasi ada di `meta`.
  const response = await adminFetch<MerchantSummary[]>(`/merchants?${apiQuery}`);
  const meta = response.meta as PageMeta | undefined;
  return (
    <PageHeader title="Penjual" description="Semua penjual yang terdaftar.">
      {response.ok && response.data ? (
        <Suspense>
          <MerchantTable
            rows={response.data}
            page={page}
            total={meta?.total ?? response.data.length}
            filtered={!!(search || status || open)}
          />
        </Suspense>
      ) : (
        <LoadError
          title="Daftar penjual belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil daftar penjual. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
