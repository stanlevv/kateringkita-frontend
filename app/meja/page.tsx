// Halaman /meja: halaman awal saat aplikasi pesan dari meja dibuka dari layar utama HP (start_url PWA, lihat
// app/manifest.ts). PWA = situs yang bisa dipasang seperti aplikasi. Isinya LastTable: membuka meja yang terakhir
// dipindai, atau menampilkan petunjuk dan tombol pindai QR bila belum pernah.
import { LastTable } from "./LastTable";

/**
 * Halaman awal /meja.
 * @returns LastTable
 */
export default function TableIndexPage() {
  return <LastTable />;
}
