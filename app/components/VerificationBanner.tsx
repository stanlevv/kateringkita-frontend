// Komponen VerificationBanner: banner status verifikasi toko di atas konten dashboard penjual.
// Dipakai app/(dashboard)/layout.tsx. Data `merchant` berasal dari sesi login (requireMerchant).
import Link from "next/link";
import { Banner } from "@/app/components/ui/Banner";

/**
 * Banner sesuai status verifikasi toko: sedang diperiksa, perlu perbaikan (dengan catatan admin dan tautan ke
 * Pengaturan), atau ditangguhkan (dengan alasan). Toko yang sudah terverifikasi tidak menampilkan apa pun.
 * @param props.merchant data toko dari sesi (bisa null)
 * @returns Banner, atau null bila tidak ada yang perlu diberitahukan
 */
export function VerificationBanner({ merchant }: { merchant: Record<string, unknown> | null }) {
  // 1. Ambil catatan admin dan alasan penangguhan bila berupa teks. 2. Pilih banner menurut status verifikasi.
  const note = typeof merchant?.verification_note === "string" ? merchant.verification_note : null;
  const suspendedReason = typeof merchant?.suspended_reason === "string" ? merchant.suspended_reason : null;
  switch (merchant?.verification_status) {
    case "pending":
      return (
        <Banner tone="info">
          Toko Anda sedang diperiksa admin. Setelah terverifikasi, toko Anda bisa ditampilkan ke pembeli.
        </Banner>
      );
    case "needs_fix":
      return (
        <Banner
          tone="warning"
          action={
            <Link href="/pengaturan" className="inline-flex min-h-11 items-center font-semibold underline">
              Lengkapi pengaturan
            </Link>
          }
        >
          Admin meminta perbaikan: {note ?? "periksa kembali data toko Anda."}
        </Banner>
      );
    case "suspended":
      return (
        <Banner tone="danger">
          Toko Anda ditangguhkan
          {suspendedReason ? `: ${suspendedReason}` : ". Hubungi admin untuk informasi lebih lanjut."}
        </Banner>
      );
    default:
      return null;
  }
}
