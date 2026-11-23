import { getTableMenu } from "@/services/table.service";
import { TableMessage } from "../TableMessage";
import { TableMenuApp } from "./TableMenuApp";

// F21: halaman yang dibuka QR meja. Data selalu segar (stok & jam buka).
export default async function TableMenuPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getTableMenu(token);
  if (!result.ok || !result.data) {
    return result.status === 404 ? (
      <TableMessage
        title="QR meja tidak aktif"
        body="QR ini sudah tidak berlaku atau toko sedang tidak menerima pesanan dari meja. Tanyakan ke kasir."
      />
    ) : (
      <TableMessage title="Menu belum bisa dimuat" body="Periksa koneksi internet lalu muat ulang halaman ini." />
    );
  }
  return <TableMenuApp token={token} data={result.data} />;
}
