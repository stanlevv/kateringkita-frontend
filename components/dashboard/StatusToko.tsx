import Link from "next/link";
import { Banner } from "@/components/ui/Banner";

/** R-15 — banner status verifikasi toko di atas konten penjual; terverifikasi tidak menampilkan apa pun. */
export function StatusToko({ merchant }: { merchant: Record<string, unknown> | null }) {
  const note = typeof merchant?.verification_note === "string" ? merchant.verification_note : null;
  const alasan = typeof merchant?.suspended_reason === "string" ? merchant.suspended_reason : null;
  switch (merchant?.verification_status) {
    case "pending":
      return <Banner tone="info">Toko Anda sedang diperiksa admin. Setelah terverifikasi, toko Anda bisa ditampilkan ke pembeli.</Banner>;
    case "needs_fix":
      return (
        <Banner tone="warning" action={<Link href="/pengaturan" className="inline-flex min-h-11 items-center font-semibold underline">Lengkapi pengaturan</Link>}>
          Admin meminta perbaikan: {note ?? "periksa kembali data toko Anda."}
        </Banner>
      );
    case "suspended":
      return <Banner tone="danger">Toko Anda ditangguhkan{alasan ? `: ${alasan}` : ". Hubungi admin untuk informasi lebih lanjut."}</Banner>;
    default:
      return null;
  }
}
