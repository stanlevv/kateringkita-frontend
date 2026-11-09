import { StatusPesanan } from "./StatusPesanan";

// F21: tujuan kembali dari halaman bayar Midtrans; data dibaca dengan token tamu dari peramban
export default async function StatusPesananMejaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <StatusPesanan code={code} />;
}
