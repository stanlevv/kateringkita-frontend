import type { Metadata } from "next";
import { requireMerchant } from "@/services/auth.service";
import { getTables } from "@/services/table.service";
import { getProfile } from "@/services/profile.service";
import { QrPrintSheet } from "./QrPrintSheet";

export const metadata: Metadata = { title: "Cetak QR meja", robots: { index: false } };

// F21: lembar QR siap cetak (A4, 2 kolom) tanpa bingkai dashboard; tetap wajib sesi penjual
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
