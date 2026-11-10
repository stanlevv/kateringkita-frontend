import { PackageX } from "lucide-react";
import { GagalMuat } from "@/app/components/GagalMuat";
import { OrderDetail } from "@/app/components/orders/OrderDetail";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { Banner } from "@/app/components/ui/Banner";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { getOrder } from "@/services/orderService";
import { requireMerchant } from "@/services/authService";
import { KembaliKePesanan } from "../components/KembaliKePesanan";

// M-04, M-08 — Detail pesanan (PS-N2, PS-A1, PS-E1).
export default async function DetailPesananPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams?: Promise<{ wa?: string }> }) {
  await requireMerchant();
  const { code } = await params;
  const waGagal = (await searchParams)?.wa === "gagal";
  const r = await getOrder(code);

  if ("error" in r) {
    return (
      <PageHeader title={r.error.code === "NOT_FOUND" ? "Pesanan tidak ditemukan" : "Pesanan belum bisa dimuat"}>
        {r.error.code === "NOT_FOUND" ? (
          <EmptyState icon={PackageX} title="Pesanan tidak ditemukan" body={`Tidak ada pesanan dengan kode ${code}. Periksa kodenya atau kembali ke daftar.`}
            action={<LinkButton href="/pesanan">Kembali ke daftar pesanan</LinkButton>} />
        ) : (
          <GagalMuat judul="Pesanan belum bisa dimuat" isi="Terjadi kesalahan saat mengambil pesanan. Periksa koneksi lalu coba lagi." />
        )}
      </PageHeader>
    );
  }
  return (
    <>
      <KembaliKePesanan />
      {waGagal && <div className="mb-4 max-w-2xl"><Banner tone="warning">WhatsApp belum bisa dibuka. Coba lagi.</Banner></div>}
      <PageHeader title={`Pesanan ${r.data.code}`}>
        <div className="max-w-2xl rounded-lg border border-line bg-surface p-5"><OrderDetail order={r.data} /></div>
      </PageHeader>
    </>
  );
}
