import { PackageX } from "lucide-react";
import { LoadError } from "@/app/components/LoadError";
import { OrderDetail } from "@/app/components/orders/OrderDetail";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { Banner } from "@/app/components/ui/Banner";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { getOrder } from "@/services/order.service";
import { requireMerchant } from "@/services/auth.service";
import { BackToOrders } from "../components/BackToOrders";

// M-04, M-08 — Detail pesanan (PS-N2, PS-A1, PS-E1).
export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ wa?: string }>;
}) {
  await requireMerchant();
  const { code } = await params;
  const whatsappFailed = (await searchParams)?.wa === "gagal";
  const result = await getOrder(code);

  if ("error" in result) {
    return (
      <PageHeader title={result.error.code === "NOT_FOUND" ? "Pesanan tidak ditemukan" : "Pesanan belum bisa dimuat"}>
        {result.error.code === "NOT_FOUND" ? (
          <EmptyState
            icon={PackageX}
            title="Pesanan tidak ditemukan"
            body={`Tidak ada pesanan dengan kode ${code}. Periksa kodenya atau kembali ke daftar.`}
            action={<LinkButton href="/pesanan">Kembali ke daftar pesanan</LinkButton>}
          />
        ) : (
          <LoadError
            title="Pesanan belum bisa dimuat"
            body="Terjadi kesalahan saat mengambil pesanan. Periksa koneksi lalu coba lagi."
          />
        )}
      </PageHeader>
    );
  }
  return (
    <>
      <BackToOrders />
      {whatsappFailed && (
        <div className="mb-4 max-w-2xl">
          <Banner tone="warning">WhatsApp belum bisa dibuka. Coba lagi.</Banner>
        </div>
      )}
      <PageHeader title={`Pesanan ${result.data.code}`}>
        <div className="max-w-2xl rounded-lg border border-line bg-surface p-5">
          <OrderDetail order={result.data} />
        </div>
      </PageHeader>
    </>
  );
}
