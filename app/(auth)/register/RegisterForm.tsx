"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import { registerMerchant } from "@/app/actions/auth";
import { Brand } from "@/app/components/shell/Brand";
import { Banner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { IconButton } from "@/app/components/ui/IconButton";
import { Input, Select } from "@/app/components/ui/Input";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { businessSchema, cekField, ownerSchema } from "@/lib/schemas";

type Jenis = { id: number; name: string };
type Nilai = Record<"full_name" | "phone" | "email" | "password" | "confirm" | "business_name" | "merchant_type_id" | "address", string>;

const AWAL: Nilai = { full_name: "", phone: "", email: "", password: "", confirm: "", business_name: "", merchant_type_id: "", address: "" };
const KOLOM_PEMILIK = ["full_name", "phone", "email", "password", "confirm"];
const PESAN_SUDAH_ADA = "Nomor WA atau email ini sudah terdaftar.";
const PESAN_JARINGAN = "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.";
const LANGKAH_SIAP = ["Lengkapi pengaturan toko", "Tambah menu pertama", "Buka dapur"];

export default function RegisterForm({ types, typesFailed }: { types: Jenis[]; typesFailed: boolean }) {
  const [langkah, setLangkah] = useState<1 | 2>(1);
  const [v, setV] = useState<Nilai>(AWAL);
  const [lihatPass, setLihatPass] = useState(false);
  const [lihatConfirm, setLihatConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [kunci, setKunci] = useState(0);
  const [umum, setUmum] = useState("");
  const judul = useRef<HTMLHeadingElement>(null);
  const pindahFokus = useRef(false);
  const router = useRouter();
  const [sudahAda, setSudahAda] = useState(false);
  const [berhasil, setBerhasil] = useState(false);
  const [pending, start] = useTransition();

  // Tombol yang diklik hilang saat langkah berganti; fokus dipindah ke judul langkah baru.
  useEffect(() => {
    if (!pindahFokus.current) return;
    pindahFokus.current = false;
    judul.current?.focus();
  }, [langkah, berhasil]);

  const skema = langkah === 1 ? ownerSchema : businessSchema;
  const ubah = (k: keyof Nilai) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const blur = (k: keyof Nilai) => () => setErrors((p) => ({ ...p, [k]: cekField(skema, v)[k] ?? "" }));
  const field = (k: keyof Nilai) => ({ name: k, value: v[k], onChange: ubah(k), onBlur: blur(k) });

  function gagalValidasi(e: Record<string, string>) {
    setErrors(e);
    if (Object.keys(e).length === 0) return false;
    setKunci((k) => k + 1);
    return true;
  }

  function lanjut(ev: FormEvent) {
    ev.preventDefault();
    setSudahAda(false);
    if (!gagalValidasi(cekField(ownerSchema, v))) { pindahFokus.current = true; setLangkah(2); }
  }

  function daftar(ev: FormEvent) {
    ev.preventDefault();
    setUmum("");
    if (gagalValidasi(cekField(businessSchema, v))) return;
    start(async () => {
      const fd = new FormData();
      for (const [k, val] of Object.entries(v)) if (k !== "confirm") fd.set(k, val);
      const res = await registerMerchant({}, fd);
      if (res.ok) { pindahFokus.current = true; return setBerhasil(true); }
      if (res.code === "NETWORK") return setUmum(PESAN_JARINGAN);
      const dariServer = Object.fromEntries(Object.entries(res.fields ?? {}).map(([k, m]) => [k, m[0]]));
      // RG-E2: 409 tanpa rincian field tetap berarti no WA/email sudah dipakai.
      if (res.code === "CONFLICT" && !dariServer.phone && !dariServer.email) dariServer.phone = PESAN_SUDAH_ADA;
      if (Object.keys(dariServer).length === 0) return setUmum(res.error ?? "Terjadi kesalahan. Coba lagi.");
      setErrors(dariServer);
      setKunci((k) => k + 1);
      setSudahAda(res.code === "CONFLICT");
      if (Object.keys(dariServer).some((k) => KOLOM_PEMILIK.includes(k))) setLangkah(1);
    });
  }

  const ringkasan = Object.entries(errors).filter(([, m]) => m).map(([id, message]) => ({ id, message }));

  if (berhasil) {
    return (
      <Bingkai>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-success-bg text-success"><Check aria-hidden className="size-6" /></span>
          <h1 ref={judul} tabIndex={-1} className="font-display text-2xl font-bold outline-none">Akun berhasil dibuat</h1>
        </div>
        <p className="mt-3 text-ink-muted">Toko <strong className="text-ink">{v.business_name}</strong> sudah terdaftar. Siapkan toko Anda dengan tiga langkah ini:</p>
        <ol className="mt-4 flex flex-col gap-2">
          {LANGKAH_SIAP.map((t, i) => (
            <li key={t} className="flex items-center gap-3 rounded-md border border-line px-4 py-3">
              <span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">{i + 1}</span>
              <span className="font-medium">{t}</span>
            </li>
          ))}
        </ol>
        <LinkButton href="/login?registered=1" size="lg" className="mt-6 w-full">Masuk ke dashboard</LinkButton>
      </Bingkai>
    );
  }

  return (
    <Bingkai>
      <h1 className="font-display text-2xl font-bold">Daftar sebagai penjual</h1>
      <ol aria-label="Langkah pendaftaran" className="mt-4 flex gap-2">
        {["Data pemilik", "Data usaha"].map((t, i) => (
          <li key={t} aria-current={langkah === i + 1 ? "step" : undefined} className={`flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm ${langkah === i + 1 ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line text-ink-muted"}`}>
            <span aria-hidden className="font-mono">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>

      {langkah === 1 ? (
        <form onSubmit={lanjut} noValidate className="mt-6 flex flex-col gap-4">
          <h2 ref={judul} tabIndex={-1} className="sr-only">Data pemilik</h2>
          <ErrorSummary errors={ringkasan} focusKey={kunci} />
          {sudahAda && (
            <Banner tone="warning" action={<Link href="/login" className="inline-flex min-h-11 items-center font-semibold underline">Masuk</Link>}>
              Nomor WA atau email ini sudah terdaftar. Sudah punya akun?
            </Banner>
          )}
          <Field label="Nama lengkap" required error={errors.full_name} id="full_name"><Input {...field("full_name")} autoComplete="name" /></Field>
          <Field label="Nomor WA" required help="Dipakai untuk masuk dan dihubungi pembeli. Contoh: 081234567890" error={errors.phone} id="phone"><Input {...field("phone")} type="tel" inputMode="numeric" autoComplete="tel" /></Field>
          <Field label="Email (opsional)" error={errors.email} id="email"><Input {...field("email")} type="email" autoComplete="email" /></Field>
          <div className="relative">
            <Field label="Kata sandi" required help="Minimal 8 karakter, berisi huruf dan angka." error={errors.password} id="password">
              <Input {...field("password")} type={lihatPass ? "text" : "password"} autoComplete="new-password" className="pr-12" />
            </Field>
            <IconButton
              icon={lihatPass ? EyeOff : Eye}
              label={lihatPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={lihatPass}
              onClick={() => setLihatPass((s) => !s)}
              className="absolute right-0 top-[26px]"
            />
          </div>
          <div className="relative">
            <Field label="Konfirmasi kata sandi" required error={errors.confirm} id="confirm">
              <Input {...field("confirm")} type={lihatConfirm ? "text" : "password"} autoComplete="new-password" className="pr-12" />
            </Field>
            <IconButton
              icon={lihatConfirm ? EyeOff : Eye}
              label={lihatConfirm ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
              aria-pressed={lihatConfirm}
              onClick={() => setLihatConfirm((s) => !s)}
              className="absolute right-0 top-[26px]"
            />
          </div>
          <Button type="submit" size="lg">Lanjut</Button>
        </form>
      ) : (
        <form onSubmit={daftar} noValidate className="mt-6 flex flex-col gap-4">
          <h2 ref={judul} tabIndex={-1} className="sr-only">Data usaha</h2>
          <ErrorSummary errors={ringkasan} focusKey={kunci} />
          {umum && <Banner tone="danger">{umum}</Banner>}
          <Field label="Nama usaha" required error={errors.business_name} id="business_name"><Input {...field("business_name")} /></Field>
          {typesFailed ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Jenis usaha</span>
              <Banner tone="danger" action={<Button variant="secondary" onClick={() => router.refresh()}>Coba lagi</Button>}>
                Daftar jenis usaha gagal dimuat.
              </Banner>
            </div>
          ) : (
            <Field label="Jenis usaha" required error={errors.merchant_type_id} id="merchant_type_id">
              <Select {...field("merchant_type_id")}>
                <option value="">Pilih jenis usaha</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Alamat" required error={errors.address} id="address"><Input {...field("address")} autoComplete="street-address" /></Field>
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" onClick={() => { setErrors({}); setUmum(""); pindahFokus.current = true; setLangkah(1); }}>Kembali</Button>
            <Button type="submit" size="lg" className="flex-1" loading={pending} loadingText="Memproses…" disabled={typesFailed}>Daftar</Button>
          </div>
        </form>
      )}
    </Bingkai>
  );
}

function Bingkai({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" aria-label="KateringKita, ke beranda" className="self-start rounded-md focus-visible:ring-2 focus-visible:ring-focus"><Brand /></Link>
      <div className="rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">{children}</div>
      <p className="text-center text-sm text-ink-muted">
        Sudah punya akun? <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-primary underline">Masuk</Link>
      </p>
    </main>
  );
}
