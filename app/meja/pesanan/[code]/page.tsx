import { TableOrderStatus } from "./TableOrderStatus";

// F21: tujuan kembali dari halaman bayar Midtrans; data dibaca dengan token tamu dari peramban
export default async function TableOrderStatusPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <TableOrderStatus code={code} />;
}
