// Halaman /register: pendaftaran akun penjual baru (dua langkah: data pemilik lalu data usaha).
// Server component: memeriksa sesi lewat cookie dan mengambil daftar jenis usaha dari backend (GET /meta/merchant-types),
// lalu menyerahkannya ke RegisterForm.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { apiFetch } from "@/services/api";
import { getSession } from "@/services/auth.service";
import RegisterForm from "./RegisterForm";

// Judul dan deskripsi halaman untuk tab peramban dan mesin pencari.
export const metadata: Metadata = {
  title: "Daftar jadi penjual katering kampus",
  description:
    "Buka toko katering di KateringKita: daftar sebagai penjual, pasang menu dan kuota porsi, lalu terima pre-order dari mahasiswa.",
  alternates: { canonical: "/register" },
};

/**
 * Halaman daftar penjual. Pengguna yang sudah masuk dialihkan dengan `redirect()`: penjual ke /dashboard, admin ke /admin.
 * @returns RegisterForm berisi daftar jenis usaha; bila daftar gagal diambil, formulir menampilkan tombol Coba lagi
 */
export default async function RegisterPage() {
  // 1. connection() menandai halaman ini dirender per permintaan (bukan sekali saat build), karena isinya bergantung pada sesi.
  await connection();
  // 2. Sudah masuk -> langsung ke dashboard. Bila backend mati, formulir tetap tampil.
  const session = await getSession().catch(() => null);
  if (session?.user.role === "merchant") redirect("/dashboard");
  if (session?.user.role === "admin") redirect("/admin");
  // 3. Ambil jenis usaha untuk pilihan di langkah kedua.
  const merchantTypes = await apiFetch<{ id: number; name: string }[]>("/meta/merchant-types");
  return <RegisterForm types={merchantTypes.data ?? []} typesFailed={!merchantTypes.ok} />;
}
