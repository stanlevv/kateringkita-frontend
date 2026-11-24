// Halaman /meja/[token]: halaman yang terbuka saat pembeli memindai QR di meja. [token] adalah token meja dari QR.
// Server component: mengambil toko, meja, dan menu dari backend (GET /tables/:token) tanpa login, lalu menyerahkannya
// ke TableMenuApp. Data diambil ulang setiap kali halaman dibuka (tanpa cache), jadi stok dan jam buka selalu terbaru.
import { getTableMenu } from "@/services/table.service";
import { TableMessage } from "../TableMessage";
import { TableMenuApp } from "./TableMenuApp";

/**
 * Halaman menu meja.
 * @param props.params parameter route; `token` = token meja dari URL
 * @returns TableMenuApp; atau TableMessage "QR meja tidak aktif" (404) dan "Menu belum bisa dimuat" (galat lain)
 */
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
