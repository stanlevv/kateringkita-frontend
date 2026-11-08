"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mintaKodeReset, resetKataSandi, type AuthState } from "@/app/actions/auth";
import { Brand } from "@/app/components/shell/Brand";
import { Banner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { cekField, emailResetSchema, resetSandiSchema } from "@/lib/schemas";

const pesanGagal: Record<string, string> = {
  RATE_LIMITED: "Terlalu banyak permintaan. Coba lagi beberapa menit lagi.",
  NETWORK: "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
  SERVICE_UNAVAILABLE: "Pengiriman email sedang tidak tersedia. Coba lagi nanti.",
};

// F11: dua langkah — email, lalu kode 6 digit + kata sandi baru → /login?reset=1
export default function LupaSandiForm() {
  const router = useRouter();
  const [langkah, setLangkah] = useState<"email" | "kode">("email");
  const [nilai, setNilai] = useState({ email: "", code: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gagal, setGagal] = useState<string | null>(null);
  const [kunci, setKunci] = useState(0);
  const [pending, start] = useTransition();
  const ubah = (k: keyof typeof nilai) => (e: { target: { value: string } }) => setNilai((p) => ({ ...p, [k]: e.target.value }));

  const tampilkan = (res: AuthState) => {
    if (res.fields) {
      setErrors(Object.fromEntries(Object.entries(res.fields).map(([k, v]) => [k, v[0]])));
      setKunci((k) => k + 1);
    }
    setGagal(pesanGagal[res.code ?? ""] ?? (res.fields ? null : res.error ?? "Terjadi kesalahan. Coba lagi."));
  };

  function kirim(ev: FormEvent) {
    ev.preventDefault();
    const e = langkah === "email" ? cekField(emailResetSchema, nilai) : cekField(resetSandiSchema, nilai);
    setErrors(e);
    setGagal(null);
    if (Object.keys(e).length) return setKunci((k) => k + 1);
    start(async () => {
      if (langkah === "email") {
        const res = await mintaKodeReset(nilai.email.trim());
        return res.ok ? setLangkah("kode") : tampilkan(res);
      }
      const res = await resetKataSandi({ email: nilai.email.trim(), code: nilai.code, password: nilai.password });
      return res.ok ? router.push("/login?reset=1") : tampilkan(res);
    });
  }

  const ringkasan = Object.entries(errors).filter(([, m]) => m).map(([id, message]) => ({ id, message }));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" aria-label="KateringKita, ke beranda" className="self-start rounded-md focus-visible:ring-2 focus-visible:ring-focus"><Brand /></Link>
      <div className="rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold">Lupa kata sandi</h1>
        <p className="mt-1 text-ink-muted">
          {langkah === "email" ? "Masukkan email akun toko. Kami kirim kode 6 angka ke email itu." : `Masukkan kode dari email ${nilai.email.trim()} dan kata sandi baru.`}
        </p>
        <form onSubmit={kirim} noValidate className="mt-6 flex flex-col gap-4">
          {gagal ? <Banner tone="danger">{gagal}</Banner> : langkah === "kode" ? <Banner tone="info">Jika email terdaftar, kode sudah dikirim. Berlaku 10 menit.</Banner> : null}
          <ErrorSummary errors={ringkasan} focusKey={kunci} />
          {langkah === "email" ? (
            <Field label="Email" required error={errors.email} id="email">
              <Input name="email" type="email" autoComplete="email" value={nilai.email} onChange={ubah("email")} />
            </Field>
          ) : (
            <>
              <Field label="Kode verifikasi" required error={errors.code} id="code">
                <Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={nilai.code} onChange={ubah("code")} />
              </Field>
              <Field label="Kata sandi baru" required error={errors.password} id="password">
                <Input name="password" type="password" autoComplete="new-password" value={nilai.password} onChange={ubah("password")} />
              </Field>
              <Field label="Ulangi kata sandi baru" required error={errors.confirm} id="confirm">
                <Input name="confirm" type="password" autoComplete="new-password" value={nilai.confirm} onChange={ubah("confirm")} />
              </Field>
            </>
          )}
          <Button type="submit" size="lg" loading={pending} loadingText="Memproses…">
            {langkah === "email" ? "Kirim kode" : "Simpan kata sandi"}
          </Button>
          {langkah === "kode" && (
            <Button type="button" variant="secondary" disabled={pending} onClick={() => { setLangkah("email"); setGagal(null); setErrors({}); }}>
              Kirim ulang kode
            </Button>
          )}
        </form>
      </div>
      <p className="text-center text-sm text-ink-muted">
        Ingat kata sandi?{" "}
        <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-primary underline">Kembali ke halaman masuk</Link>
      </p>
    </main>
  );
}
