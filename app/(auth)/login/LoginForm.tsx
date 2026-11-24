// Formulir masuk penjual dan admin di halaman /login: email atau nomor WA, kata sandi, dan banner keterangan.
// Data dikirim ke server action `login` (app/actions/auth.ts), yang memanggil backend POST /auth/login dan menyimpan
// token di cookie sesi. Server action adalah fungsi server yang bisa dipanggil langsung dari komponen klien.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, dan event form.
"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { login, type AuthState } from "@/app/actions/auth";
import { Brand } from "@/app/components/shell/Brand";
import { Banner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { IconButton } from "@/app/components/ui/IconButton";
import { Input } from "@/app/components/ui/Input";
import { validateFields, loginSchema } from "@/lib/schemas";

// Akun pembeli tidak boleh masuk dashboard; mereka memakai aplikasi ponsel.
const CUSTOMER_ACCOUNT_MESSAGE = "Akun ini akun pembeli. Gunakan aplikasi KateringKita di ponsel.";
// id elemen field, dipakai ErrorSummary untuk melompat ke field yang salah.
const FIELD_IDS = { identifier: "identifier", password: "password" } as const;

// Pesan yang ditampilkan per kode galat dari server action; kode lain memakai pesan dari server.
const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Email/WA atau kata sandi salah.",
  RATE_LIMITED: "Terlalu banyak percobaan. Coba lagi dalam 1 menit.",
  NETWORK: "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
  NOT_MERCHANT: CUSTOMER_ACCOUNT_MESSAGE,
};

/** Prop LoginForm; semuanya diisi page.tsx dari parameter URL dan status pemeliharaan. */
type Props = {
  next?: string;
  reason?: "sesi-habis" | "bukan-penjual";
  registered?: boolean;
  reset?: boolean;
  maintenanceMessage?: string;
};

/**
 * Formulir masuk. Galat per field tampil di bawah field dan di ringkasan galat; galat dari server tampil di banner.
 * Setelah 429 (RATE_LIMITED) tombol Masuk dikunci 60 detik dengan hitung mundur.
 * @param props.next halaman tujuan setelah masuk (dari `?next=`, diisi proxy saat sesi belum ada)
 * @param props.reason alasan dialihkan ke sini: `sesi-habis` (sesi berakhir) atau `bukan-penjual` (akun pembeli)
 * @param props.registered true setelah daftar berhasil, menampilkan banner "Akun berhasil dibuat"
 * @param props.reset true setelah kata sandi diganti lewat lupa sandi
 * @param props.maintenanceMessage pesan pemeliharaan bila sistem sedang dalam mode pemeliharaan
 * @returns halaman masuk lengkap (logo, kartu formulir, tautan daftar)
 */
export default function LoginForm({ next, reason, registered, reset, maintenanceMessage }: Props) {
  // 1. State isian, galat, dan hitung mundur. `errorFocusKey` naik setiap kali kirim gagal validasi, supaya
  //    ErrorSummary memindahkan fokus ke ringkasan galat lagi. useTransition memberi `pending` selama server action berjalan.
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<AuthState | null>(null);
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const coolingDown = secondsLeft > 0;
  const [pending, startTransition] = useTransition();

  // 2. Hitung mundur 60 detik setelah terlalu banyak percobaan: kurangi satu tiap detik sampai 0.
  useEffect(() => {
    if (!coolingDown) return;
    const timer = setInterval(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearInterval(timer);
  }, [coolingDown]);

  // 3. Periksa satu field saat kursor meninggalkannya (blur), supaya galat tampil sebelum tombol ditekan.
  const validateOnBlur = (field: "identifier" | "password") => () => {
    const error = validateFields(loginSchema, { identifier, password })[field];
    setErrors((previous) => ({ ...previous, [field]: error ?? "" }));
  };

  // 4. Kirim: periksa isian dulu, lalu panggil server action. Bila berhasil, server action mengalihkan halaman
  //    sehingga hasilnya kosong; bila gagal, galatnya ditampilkan sesuai kodenya.
  function submit(event: FormEvent) {
    // 1. Cegah muat ulang halaman, lalu periksa isian; bila ada galat, fokus ke ringkasan galat.
    event.preventDefault();
    const fieldErrors = validateFields(loginSchema, { identifier, password });
    setErrors(fieldErrors);
    setFailure(null);
    if (Object.keys(fieldErrors).length) return setErrorFocusKey((count) => count + 1);
    // 2. Kirim dan tangani hasilnya di dalam transisi (selama itu tombol menampilkan "Memproses…").
    startTransition(async () => {
      // 1. Kirim ke server action dalam bentuk FormData, sama seperti formulir HTML biasa.
      const formData = new FormData();
      formData.set("identifier", identifier);
      formData.set("password", password);
      if (next) formData.set("next", next);
      const result: AuthState | undefined = await login({}, formData); // berhasil -> redirect, hasil kosong
      if (!result) return;
      // 2. Tangani galat: sandi salah mengosongkan dan memfokuskan field sandi, 429 memulai hitung mundur,
      //    galat validasi dari server ditampilkan per field.
      setFailure(result);
      if (result.code === "UNAUTHENTICATED") {
        setPassword("");
        document.getElementById(FIELD_IDS.password)?.focus();
      }
      if (result.code === "RATE_LIMITED") setSecondsLeft(60);
      if (result.code === "VALIDATION_ERROR" && result.fields) {
        setErrors(Object.fromEntries(Object.entries(result.fields).map(([field, messages]) => [field, messages[0]])));
        setErrorFocusKey((count) => count + 1);
      }
    });
  }

  // 5. Siapkan isi layar: ringkasan galat, pesan galat server (pesan 429 hilang setelah hitung mundur habis), dan
  //    banner keterangan dari parameter URL bila tidak ada galat.
  const errorSummary = Object.entries(errors)
    .filter(([, message]) => message)
    .map(([field, message]) => ({ id: FIELD_IDS[field as keyof typeof FIELD_IDS] ?? field, message }));
  const failureMessage =
    failure &&
    (failure.code !== "RATE_LIMITED" || coolingDown) &&
    (ERROR_MESSAGES[failure.code ?? ""] ?? failure.error ?? "Terjadi kesalahan. Coba lagi.");
  const contextBanner =
    reason === "bukan-penjual" ? (
      <Banner tone="danger">{CUSTOMER_ACCOUNT_MESSAGE}</Banner>
    ) : reason === "sesi-habis" ? (
      <Banner tone="warning">Sesi berakhir, silakan masuk lagi</Banner>
    ) : registered ? (
      <Banner tone="success">Akun berhasil dibuat. Silakan masuk.</Banner>
    ) : reset ? (
      <Banner tone="success">Kata sandi sudah diganti. Silakan masuk.</Banner>
    ) : next ? (
      <Banner tone="info">Masuk untuk melanjutkan</Banner>
    ) : null;

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
        <h1 className="font-display text-2xl font-bold">Masuk ke dashboard</h1>
        <p className="mt-1 text-ink-muted">Kelola menu, kuota, dan pesanan toko Anda.</p>
        <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
          {maintenanceMessage && <Banner tone="warning">{maintenanceMessage}</Banner>}
          {failureMessage ? <Banner tone="danger">{failureMessage}</Banner> : contextBanner}
          <ErrorSummary errors={errorSummary} focusKey={errorFocusKey} />
          <Field label="Email atau nomor WA" required error={errors.identifier} id={FIELD_IDS.identifier}>
            <Input
              name="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              onBlur={validateOnBlur("identifier")}
            />
          </Field>
          <div className="relative">
            <Field label="Kata sandi" required error={errors.password} id={FIELD_IDS.password}>
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pr-12"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={validateOnBlur("password")}
              />
            </Field>
            {/* top = tinggi label + jarak, supaya sejajar dengan kotak isian */}
            <IconButton
              icon={showPassword ? EyeOff : Eye}
              label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
              className="absolute right-0 top-[26px]"
            />
          </div>
          <Link
            href="/lupa-sandi"
            className="-mt-2 inline-flex min-h-11 items-center self-end text-sm font-medium text-primary underline"
          >
            Lupa kata sandi?
          </Link>
          <Button type="submit" size="lg" loading={pending} loadingText="Memproses…" disabled={coolingDown}>
            {coolingDown ? `Coba lagi dalam ${secondsLeft} dtk` : "Masuk"}
          </Button>
        </form>
      </div>
      <p className="text-center text-sm text-ink-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="inline-flex min-h-11 items-center font-medium text-primary underline">
          Daftar sebagai penjual
        </Link>
      </p>
    </main>
  );
}
