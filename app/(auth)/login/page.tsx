import { redirect } from "next/navigation";
import { getSession } from "@/services/authService";
import LoginForm from "./LoginForm";

type Params = { next?: string; alasan?: string; registered?: string; reset?: string };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { next, alasan, registered, reset } = await searchParams;
  // LG-A3: sudah masuk -> dashboard. Backend mati -> tetap tampilkan form (LG-E4 menangani saat kirim).
  const session = await getSession().catch(() => null);
  if (session?.user.role === "merchant") redirect("/dashboard");
  if (session?.user.role === "admin") redirect("/admin");
  return (
    <LoginForm
      next={next}
      alasan={alasan === "sesi-habis" || alasan === "bukan-penjual" ? alasan : undefined}
      registered={registered === "1"}
      reset={reset === "1"}
    />
  );
}
