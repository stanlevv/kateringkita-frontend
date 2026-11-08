import Link from "next/link";
import { ChevronLeft, PackageX } from "lucide-react";
import { GagalMuat } from "@/app/components/GagalMuat";
import { OrderDetail } from "@/app/components/orders/OrderDetail";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { Banner } from "@/app/components/ui/Banner";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { getOrder } from "@/services/orderService";
import { requireMerchant } from "@/services/authService";

const Kembali = () => (
  <Link href="/pesanan" className="mb-4 inline-flex min-h-11 items-center gap-1 text-primary hover:underline focus-visible:ring-2 focus-visible:ring-focus">
    <ChevronLeft aria-hidden className="size-4" />Kembali ke daftar pesanan
  </Link>
);

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
      <Kembali />
      {waGagal && <div className="mb-4 max-w-2xl"><Banner tone="warning">WhatsApp belum bisa dibuka. Coba lagi.</Banner></div>}
      <PageHeader title={`Pesanan ${r.data.code}`}>
        <div className="max-w-2xl rounded-lg border border-line bg-surface p-5"><OrderDetail order={r.data} /></div>
      </PageHeader>
    </>
  );
}
