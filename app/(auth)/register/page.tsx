import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { apiFetch } from "@/services/api";
import { getSession } from "@/services/authService";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Daftar jadi penjual katering kampus",
  description: "Buka toko katering di KateringKita: daftar sebagai penjual, pasang menu dan kuota porsi, lalu terima pre-order dari mahasiswa.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage() {
  await connection();
  // RG-A2: sudah masuk -> dashboard. Backend mati -> tetap tampilkan form.
  const session = await getSession().catch(() => null);
  if (session?.user.role === "merchant") redirect("/dashboard");
  if (session?.user.role === "admin") redirect("/admin");
  const res = await apiFetch<{ id: number; name: string }[]>("/meta/merchant-types");
  return <RegisterForm types={res.data ?? []} typesFailed={!res.ok} />;
}
