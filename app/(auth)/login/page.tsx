// Halaman /login: pintu masuk penjual dan admin.
// Server component (berjalan di server, tanpa "use client"): membaca searchParams (parameter URL ?next=, ?alasan=,
// ?registered=, ?reset=), memeriksa sesi lewat cookie, mengambil status pemeliharaan dari backend (GET /meta/settings),
// lalu menyerahkan semuanya ke LoginForm. Folder (auth) hanya pengelompok; tanda kurung membuatnya tidak masuk URL.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/services/auth.service";
import { getMaintenance } from "@/services/meta.service";
import { DEFAULT_MAINTENANCE_MESSAGE } from "@/app/components/MaintenanceNotice";
import LoginForm from "./LoginForm";

// Judul dan deskripsi halaman untuk tab peramban dan mesin pencari. canonical tanpa ?next=… supaya varian URL login tidak dianggap halaman berbeda.
export const metadata: Metadata = {
  title: "Masuk penjual",
  description: "Masuk ke dashboard KateringKita untuk mengelola menu, kuota porsi, dan pesanan katering kampus Anda.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

/** Parameter URL yang dibaca halaman ini; nama kuncinya mengikuti URL, jadi tetap bahasa Indonesia (`alasan`). */
type Params = { next?: string; alasan?: string; registered?: string; reset?: string };

/**
 * Halaman masuk. Pengguna yang sudah masuk langsung dialihkan dengan `redirect()` (menghentikan render dan
 * mengirim pengguna ke URL lain): penjual ke /dashboard, admin ke /admin.
 * @param props.searchParams parameter URL: `next` (tujuan setelah masuk), `alasan`, `registered=1`, `reset=1`
 * @returns LoginForm dengan banner yang sesuai; nilai `alasan` yang tidak dikenal diabaikan
 */
export default async function LoginPage({ searchParams }: { searchParams: Promise<Params> }) {
  // 1. Baca parameter URL.
  const { next, alasan: reason, registered, reset } = await searchParams;
  // 2. Sudah masuk -> langsung ke dashboard. Bila backend mati, sesi dianggap kosong dan formulir tetap tampil;
  //    galat koneksi baru ditampilkan saat formulir dikirim.
  const session = await getSession().catch(() => null);
  if (session?.user.role === "merchant") redirect("/dashboard");
  if (session?.user.role === "admin") redirect("/admin");
  // 3. Ambil status pemeliharaan, lalu tampilkan formulir.
  const maintenance = await getMaintenance();
  return (
    <LoginForm
      next={next}
      reason={reason === "sesi-habis" || reason === "bukan-penjual" ? reason : undefined}
      registered={registered === "1"}
      reset={reset === "1"}
      maintenanceMessage={maintenance.aktif ? (maintenance.pesan ?? DEFAULT_MAINTENANCE_MESSAGE) : undefined}
    />
  );
}
