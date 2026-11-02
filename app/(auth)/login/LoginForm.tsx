"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { login, type AuthState } from "@/app/actions/auth";
import { Brand } from "@/components/shell/Brand";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { Field } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { cekField, loginSchema } from "@/lib/schemas";

const TEKS_PEMBELI = "Akun ini akun pembeli. Gunakan aplikasi KateringKita di ponsel.";
const ID_FIELD = { identifier: "identifier", password: "password" } as const;

const pesanGagal: Record<string, string> = {
  UNAUTHENTICATED: "Email/WA atau kata sandi salah.",
  RATE_LIMITED: "Terlalu banyak percobaan. Coba lagi dalam 1 menit.",
  NETWORK: "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
  NOT_MERCHANT: TEKS_PEMBELI,
};

type Props = { next?: string; alasan?: "sesi-habis" | "bukan-penjual"; registered?: boolean };

export default function LoginForm({ next, alasan, registered }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gagal, setGagal] = useState<AuthState | null>(null);
  const [kunci, setKunci] = useState(0);
  const [sisa, setSisa] = useState(0);
  const aktif = sisa > 0;
  const [pending, start] = useTransition();

  // LG-E3: hitung mundur 60 dtk.
  useEffect(() => {
    if (!aktif) return;
    const h = setInterval(() => setSisa((s) => s - 1), 1000);
    return () => clearInterval(h);
  }, [aktif]);

  const blur = (nama: "identifier" | "password") => () => {
    const e = cekField(loginSchema, { identifier, password })[nama];
    setErrors((p) => ({ ...p, [nama]: e ?? "" }));
  };

  function kirim(ev: FormEvent) {
    ev.preventDefault();
    const e = cekField(loginSchema, { identifier, password });
    setErrors(e);
    setGagal(null);
    if (Object.keys(e).length) return setKunci((k) => k + 1);
    start(async () => {
      const fd = new FormData();
      fd.set("identifier", identifier);
      fd.set("password", password);
      if (next) fd.set("next", next);
      const res: AuthState | undefined = await login({}, fd); // berhasil -> redirect, hasil kosong
      if (!res) return;
      setGagal(res);
      if (res.code === "UNAUTHENTICATED") { setPassword(""); document.getElementById(ID_FIELD.password)?.focus(); }
      if (res.code === "RATE_LIMITED") setSisa(60);
      if (res.code === "VALIDATION_ERROR" && res.fields) {
        setErrors(Object.fromEntries(Object.entries(res.fields).map(([k, v]) => [k, v[0]])));
        setKunci((k) => k + 1);
      }
    });
  }

  const ringkasan = Object.entries(errors).filter(([, m]) => m).map(([k, message]) => ({ id: ID_FIELD[k as keyof typeof ID_FIELD] ?? k, message }));
  const pesanGagalTampil = gagal && (gagal.code !== "RATE_LIMITED" || aktif) && (pesanGagal[gagal.code ?? ""] ?? gagal.error ?? "Terjadi kesalahan. Coba lagi.");
  const konteks = alasan === "bukan-penjual"
    ? <Banner tone="danger">{TEKS_PEMBELI}</Banner>
    : alasan === "sesi-habis"
      ? <Banner tone="warning">Sesi berakhir, silakan masuk lagi</Banner>
      : registered
        ? <Banner tone="success">Akun berhasil dibuat. Silakan masuk.</Banner>
        : next
          ? <Banner tone="info">Masuk untuk melanjutkan</Banner>
          : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" aria-label="KateringKita, ke beranda" className="self-start rounded-md focus-visible:ring-2 focus-visible:ring-focus"><Brand /></Link>
      <div className="rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold">Masuk ke dashboard</h1>
        <p className="mt-1 text-ink-muted">Kelola menu, kuota, dan pesanan toko Anda.</p>
        <form onSubmit={kirim} noValidate className="mt-6 flex flex-col gap-4">
          {pesanGagalTampil ? <Banner tone="danger">{pesanGagalTampil}</Banner> : konteks}
          <ErrorSummary errors={ringkasan} focusKey={kunci} />
          <Field label="Email atau nomor WA" required error={errors.identifier} id={ID_FIELD.identifier}>
            <Input name="identifier" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} onBlur={blur("identifier")} />
          </Field>
          <div className="relative">
            <Field label="Kata sandi" required error={errors.password} id={ID_FIELD.password}>
              <Input name="password" type={lihat ? "text" : "password"} autoComplete="current-password" className="pr-12" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={blur("password")} />
            </Field>
            {/* top = tinggi label + jarak, supaya sejajar dengan kotak isian */}
            <IconButton
              icon={lihat ? EyeOff : Eye}
              label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={lihat}
              onClick={() => setLihat((v) => !v)}
              className="absolute right-0 top-[26px]"
            />
          </div>
          <Button type="submit" size="lg" loading={pending} loadingText="Memproses…" disabled={aktif}>
            {aktif ? `Coba lagi dalam ${sisa} dtk` : "Masuk"}
          </Button>
        </form>
      </div>
      <p className="text-center text-sm text-ink-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="inline-flex min-h-11 items-center font-medium text-primary underline">Daftar sebagai penjual</Link>
      </p>
    </main>
  );
}
