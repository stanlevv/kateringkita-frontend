// Halaman /meja/pesanan/[code]: status pesanan dari meja. [code] adalah kode pesanan.
// Pembeli kembali ke sini dari halaman bayar Midtrans. Server tidak mengambil data apa pun; TableOrderStatus
// membacanya di peramban dengan token tamu yang tersimpan di localStorage HP yang dipakai memesan.
import { TableOrderStatus } from "./TableOrderStatus";

/**
 * Halaman status pesanan dari meja.
 * @param props.params parameter route; `code` = kode pesanan dari URL
 * @returns TableOrderStatus untuk kode itu
 */
export default async function TableOrderStatusPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <TableOrderStatus code={code} />;
}
