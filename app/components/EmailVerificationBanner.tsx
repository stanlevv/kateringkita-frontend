// Komponen EmailVerificationBanner: pengingat di atas konten dashboard penjual bahwa email akun belum diverifikasi.
// Dipakai app/(dashboard)/layout.tsx. Data `user` berasal dari sesi login (requireMerchant).
import Link from "next/link";
import { Banner } from "@/app/components/ui/Banner";

/**
 * Banner ajakan verifikasi email, dengan tautan ke Pengaturan > Akun. Akun tanpa email atau yang emailnya sudah
 * terverifikasi tidak menampilkan apa pun.
 * @param props.user data pengguna dari sesi
 * @returns Banner, atau null bila tidak perlu
 */
export function EmailVerificationBanner({ user }: { user: Record<string, unknown> }) {
  if (!user.email || user.email_verified !== false) return null;
  return (
    <Banner
      tone="warning"
      action={
        <Link href="/pengaturan?lengkapi=akun" className="inline-flex min-h-11 items-center font-semibold underline">
          Verifikasi email
        </Link>
      }
    >
      Email Anda belum diverifikasi. Masukkan kode yang kami kirim ke email supaya akun lebih aman.
    </Banner>
  );
}
