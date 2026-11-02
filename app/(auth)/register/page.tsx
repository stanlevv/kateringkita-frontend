import { redirect } from "next/navigation";
import { connection } from "next/server";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  await connection();
  // RG-A2: sudah masuk -> dashboard. Backend mati -> tetap tampilkan form.
  const session = await getSession().catch(() => null);
  if (session?.user.role === "merchant") redirect("/dashboard");
  if (session?.user.role === "admin") redirect("/admin");
  const res = await apiFetch<{ id: number; name: string }[]>("/meta/merchant-types");
  return <RegisterForm types={res.data ?? []} typesFailed={!res.ok} />;
}
