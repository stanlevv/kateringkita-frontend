import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/services/auth.service";
import { getMaintenance } from "@/services/meta.service";
import { DEFAULT_MAINTENANCE_MESSAGE } from "@/app/components/MaintenanceNotice";
import LoginForm from "./LoginForm";

// canonical tanpa ?next=… supaya varian URL login tidak dianggap halaman berbeda.
export const metadata: Metadata = {
  title: "Masuk penjual",
  description: "Masuk ke dashboard KateringKita untuk mengelola menu, kuota porsi, dan pesanan katering kampus Anda.",
  alternates: { canonical: "/login" },
};

type Params = { next?: string; alasan?: string; registered?: string; reset?: string };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { next, alasan: reason, registered, reset } = await searchParams;
  // LG-A3: sudah masuk -> dashboard. Backend mati -> tetap tampilkan form (LG-E4 menangani saat kirim).
  const session = await getSession().catch(() => null);
  if (session?.user.role === "merchant") redirect("/dashboard");
  if (session?.user.role === "admin") redirect("/admin");
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
