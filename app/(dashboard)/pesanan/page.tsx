// Halaman /pesanan: daftar pesanan penjual dengan cari, filter tanggal dan status, serta halaman (paginasi).
// Server component: membaca searchParams (parameter URL seperti ?tanggal=&status=&q=&page=), mengambil satu halaman
// pesanan lewat getOrders di server, lalu menyerahkannya ke OrderTable.
import { Suspense } from "react";
import { OrderTable } from "@/app/(dashboard)/pesanan/components/OrderTable";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getOrders } from "@/services/order.service";
import { todayWib } from "@/lib/format";
import { STATUS_FILTER } from "@/lib/order-filter";
import { requireMerchant } from "@/services/auth.service";

/** Nilai pertama parameter URL (parameter yang diulang bisa berupa array); kosong bila tidak ada. */
const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/**
 * Halaman daftar pesanan. Filter dan halaman disimpan di URL dan diproses server, jadi tautan bisa dibagikan dan
 * tombol Back bekerja.
 * @param props.searchParams parameter URL: `tanggal` (YYYY-MM-DD), `status`, `q` (kode/nama), `page`
 * @returns PageHeader berisi OrderTable. Suspense dibutuhkan karena OrderTable membaca URL di klien
 * (useSearchParams).
 */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 1. Pastikan penjual sudah masuk, lalu baca parameter URL.
  await requireMerchant();
  const query = await searchParams;
  const date = firstValue(query.tanggal);
  const status = STATUS_FILTER.find((filter) => filter.id === firstValue(query.status))?.id;
  // 2. Nilai yang tidak sah diabaikan: tanggal bawaan hari ini (WIB), q maksimal 50 karakter, halaman minimal 1.
  const orders = await getOrders({
    status,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayWib(),
    q: firstValue(query.q).trim().slice(0, 50) || undefined,
    page: Math.max(1, Math.floor(Number(firstValue(query.page))) || 1),
  });
  return (
    <PageHeader title="Pesanan">
      <Suspense>
        <OrderTable
          rows={"data" in orders ? orders.data.rows : []}
          total={"data" in orders ? orders.data.total : 0}
          loadFailed={"error" in orders}
        />
      </Suspense>
    </PageHeader>
  );
}
