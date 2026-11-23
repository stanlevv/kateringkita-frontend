import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Lupa kata sandi", robots: { index: false, follow: true } };

// F11: publik (proxy.ts hanya menjaga rute dashboard/admin)
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
