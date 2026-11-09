import { getMenuMeja } from "@/services/mejaService";
import { MejaPesan } from "../MejaPesan";
import { MenuMejaApp } from "./MenuMejaApp";

// F21: halaman yang dibuka QR meja. Data selalu segar (stok & jam buka).
export default async function MenuMejaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getMenuMeja(token);
  if (!r.ok || !r.data) {
    return r.status === 404
      ? <MejaPesan judul="QR meja tidak aktif" isi="QR ini sudah tidak berlaku atau toko sedang tidak menerima pesanan dari meja. Tanyakan ke kasir." />
      : <MejaPesan judul="Menu belum bisa dimuat" isi="Periksa koneksi internet lalu muat ulang halaman ini." />;
  }
  return <MenuMejaApp token={token} data={r.data} />;
}
