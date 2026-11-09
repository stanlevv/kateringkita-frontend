import type { Metadata } from "next";
import { requireMerchant } from "@/services/authService";
import { getTables } from "@/services/mejaService";
import { getProfile } from "@/services/profileService";
import { CetakQr } from "./CetakQr";

export const metadata: Metadata = { title: "Cetak QR meja", robots: { index: false } };

// F21: lembar QR siap cetak (A4, 2 kolom) tanpa bingkai dashboard; tetap wajib sesi penjual
export default async function CetakQrPage() {
  await requireMerchant();
  const [profil, meja] = await Promise.all([getProfile(), getTables()]);
  if ("error" in profil || "error" in meja) {
    return <p className="p-8 text-danger">QR meja belum bisa dimuat. Tutup halaman ini lalu coba lagi.</p>;
  }
  return <CetakQr toko={profil.data.business_name} meja={meja.data.filter((m) => m.is_active)} />;
}
