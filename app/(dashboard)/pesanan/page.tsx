import { Suspense } from "react";
import { OrderTable } from "@/app/(dashboard)/pesanan/components/OrderTable";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getOrders } from "@/services/order.service";
import { todayWib } from "@/lib/format";
import { STATUS_FILTER } from "@/lib/order-filter";
import { requireMerchant } from "@/services/auth.service";

const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

// M-04, M-08 — Daftar pesanan (PS-N1, PS-N3, PS-S1). Filter dan halaman di URL, diproses server.
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireMerchant();
  const query = await searchParams;
  const date = firstValue(query.tanggal);
  const status = STATUS_FILTER.find((filter) => filter.id === firstValue(query.status))?.id;
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
