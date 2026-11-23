// Halaman /cetak-qr: lembar QR meja siap cetak untuk penjual (pesan dari meja: pembeli memindai QR di meja lalu memesan
// dari HP). Dibuka dari Pengaturan > Pesan dari meja. Halaman ini sengaja di luar folder dashboard agar tercetak tanpa
// sidebar dan header. Server component: mengambil profil toko (getProfile) dan daftar meja (getTables,
// GET /merchant/tables), lalu menyerahkan meja yang aktif ke QrPrintSheet.
import type { Metadata } from "next";
import { requireMerchant } from "@/services/auth.service";
import { getTables } from "@/services/table.service";
import { getProfile } from "@/services/profile.service";
import { QrPrintSheet } from "./QrPrintSheet";

// Judul tab peramban; robots index false agar halaman ini tidak masuk mesin pencari.
export const metadata: Metadata = { title: "Cetak QR meja", robots: { index: false } };

/**
 * Lembar QR siap cetak (A4, 2 kolom) tanpa bingkai dashboard; tetap wajib sesi penjual.
 * @returns QrPrintSheet, atau pesan galat bila profil atau meja gagal dimuat
 */
export default async function PrintQrPage() {
  await requireMerchant();
  const [profile, tables] = await Promise.all([getProfile(), getTables()]);
  if ("error" in profile || "error" in tables) {
    return <p className="p-8 text-danger">QR meja belum bisa dimuat. Tutup halaman ini lalu coba lagi.</p>;
  }
  return (
    <QrPrintSheet merchantName={profile.data.business_name} tables={tables.data.filter((table) => table.is_active)} />
  );
}
