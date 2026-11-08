import { Suspense } from "react";
import { OrderTable } from "@/app/(dashboard)/pesanan/components/OrderTable";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getOrders } from "@/services/orderService";
import { hariIniWib } from "@/lib/format";
import { STATUS_FILTER } from "@/lib/order-filter";
import { requireMerchant } from "@/services/authService";

const satu = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// M-04, M-08 — Daftar pesanan (PS-N1, PS-N3, PS-S1). Filter dan halaman di URL, diproses server.
export default async function PesananPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireMerchant();
  const sp = await searchParams;
  const tanggal = satu(sp.tanggal);
  const status = STATUS_FILTER.find((s) => s.id === satu(sp.status))?.id;
  const orders = await getOrders({
    status,
    tanggal: /^\d{4}-\d{2}-\d{2}$/.test(tanggal) ? tanggal : hariIniWib(),
    q: satu(sp.q).trim().slice(0, 50) || undefined,
    page: Math.max(1, Math.floor(Number(satu(sp.page))) || 1),
  });
  return (
    <PageHeader title="Pesanan">
      <Suspense>
        <OrderTable rows={"data" in orders ? orders.data.rows : []} total={"data" in orders ? orders.data.total : 0} galat={"error" in orders} />
      </Suspense>
    </PageHeader>
  );
}
