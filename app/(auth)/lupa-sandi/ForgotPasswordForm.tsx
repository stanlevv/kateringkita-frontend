"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestResetCode, resetPassword, type AuthState } from "@/app/actions/auth";
import { Brand } from "@/app/components/shell/Brand";
import { Banner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { validateFields, emailResetSchema, resetPasswordSchema } from "@/lib/schemas";

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMITED: "Terlalu banyak permintaan. Coba lagi beberapa menit lagi.",
  NETWORK: "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
  SERVICE_UNAVAILABLE: "Pengiriman email sedang tidak tersedia. Coba lagi nanti.",
};

// F11: dua langkah — email, lalu kode 6 digit + kata sandi baru → /login?reset=1
export default function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "kode">("email");
  const [values, setValues] = useState({ email: "", code: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const handleChange = (field: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((previous) => ({ ...previous, [field]: event.target.value }));

  const showError = (result: AuthState) => {
    if (result.fields) {
      setErrors(Object.fromEntries(Object.entries(result.fields).map(([field, messages]) => [field, messages[0]])));
      setErrorFocusKey((count) => count + 1);
    }
    setErrorMessage(
      ERROR_MESSAGES[result.code ?? ""] ?? (result.fields ? null : (result.error ?? "Terjadi kesalahan. Coba lagi.")),
    );
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    const fieldErrors =
      step === "email" ? validateFields(emailResetSchema, values) : validateFields(resetPasswordSchema, values);
    setErrors(fieldErrors);
    setErrorMessage(null);
    if (Object.keys(fieldErrors).length) return setErrorFocusKey((count) => count + 1);
    startTransition(async () => {
      if (step === "email") {
        const result = await requestResetCode(values.email.trim());
        return result.ok ? setStep("kode") : showError(result);
      }
      const result = await resetPassword({ email: values.email.trim(), code: values.code, password: values.password });
      return result.ok ? router.push("/login?reset=1") : showError(result);
    });
  }

  const errorSummary = Object.entries(errors)
    .filter(([, message]) => message)
    .map(([id, message]) => ({ id, message }));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Link
        href="/"
        aria-label="KateringKita, ke beranda"
        className="self-start rounded-md focus-visible:ring-2 focus-visible:ring-focus"
      >
        <Brand />
      </Link>
      <div className="rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold">Lupa kata sandi</h1>
        <p className="mt-1 text-ink-muted">
          {step === "email"
            ? "Masukkan email akun toko. Kami kirim kode 6 angka ke email itu."
            : `Masukkan kode dari email ${values.email.trim()} dan kata sandi baru.`}
        </p>
        <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
          {errorMessage ? (
            <Banner tone="danger">{errorMessage}</Banner>
          ) : step === "kode" ? (
            <Banner tone="info">Jika email terdaftar, kode sudah dikirim. Berlaku 10 menit.</Banner>
          ) : null}
          <ErrorSummary errors={errorSummary} focusKey={errorFocusKey} />
          {step === "email" ? (
            <Field label="Email" required error={errors.email} id="email">
              <Input
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange("email")}
              />
            </Field>
          ) : (
            <>
              <Field label="Kode verifikasi" required error={errors.code} id="code">
                <Input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={values.code}
                  onChange={handleChange("code")}
                />
              </Field>
              <Field label="Kata sandi baru" required error={errors.password} id="password">
                <Input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={values.password}
                  onChange={handleChange("password")}
                />
              </Field>
              <Field label="Ulangi kata sandi baru" required error={errors.confirm} id="confirm">
                <Input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={values.confirm}
                  onChange={handleChange("confirm")}
                />
              </Field>
            </>
          )}
          <Button type="submit" size="lg" loading={pending} loadingText="Memproses…">
            {step === "email" ? "Kirim kode" : "Simpan kata sandi"}
          </Button>
          {step === "kode" && (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setStep("email");
                setErrorMessage(null);
                setErrors({});
              }}
            >
              Kirim ulang kode
            </Button>
          )}
        </form>
      </div>
      <p className="text-center text-sm text-ink-muted">
        Ingat kata sandi?{" "}
        <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-primary underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </main>
  );
}
