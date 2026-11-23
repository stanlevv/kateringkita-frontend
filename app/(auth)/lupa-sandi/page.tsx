// Halaman /lupa-sandi: penjual meminta kode lewat email, lalu membuat kata sandi baru.
// Halaman ini publik: proxy.ts hanya menjaga halaman dashboard dan admin. Semua logika ada di ForgotPasswordForm.
import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

// Judul tab; robots index:false agar halaman ini tidak muncul di hasil mesin pencari.
export const metadata: Metadata = { title: "Lupa kata sandi", robots: { index: false, follow: true } };

/**
 * Halaman lupa kata sandi.
 * @returns ForgotPasswordForm
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
