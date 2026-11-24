// Formulir daftar penjual di halaman /register, dalam dua langkah: data pemilik (nama, WA, email, sandi) lalu data
// usaha (nama usaha, jenis usaha, alamat). Data dikirim ke server action `registerMerchant` (backend POST
// /auth/merchant/register). Setelah berhasil tampil layar "Akun berhasil dibuat"; pengguna tidak masuk otomatis.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, dan event form.
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
import { businessSchema, validateFields, ownerSchema } from "@/lib/schemas";

/** Satu jenis usaha dari backend (GET /meta/merchant-types). */
type MerchantType = { id: number; name: string };
/** Isian formulir. Kuncinya sama dengan nama field yang diminta backend, kecuali `confirm` yang tidak dikirim. */
type FormValues = Record<
  "full_name" | "phone" | "email" | "password" | "confirm" | "business_name" | "merchant_type_id" | "address",
  string
>;

const INITIAL_VALUES: FormValues = {
  full_name: "",
  phone: "",
  email: "",
  password: "",
  confirm: "",
  business_name: "",
  merchant_type_id: "",
  address: "",
};
// Field langkah 1; bila server menolak salah satunya, formulir kembali ke langkah 1.
const OWNER_FIELDS = ["full_name", "phone", "email", "password", "confirm"];
const ALREADY_REGISTERED_MESSAGE = "Nomor WA atau email ini sudah terdaftar.";
const NETWORK_ERROR_MESSAGE = "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.";
// Langkah persiapan toko yang ditampilkan setelah daftar berhasil.
const SETUP_STEPS = ["Lengkapi pengaturan toko", "Tambah menu pertama", "Buka dapur"];

/**
 * Formulir daftar penjual dua langkah dengan stepper, galat per field, dan layar berhasil.
 * @param props.types daftar jenis usaha untuk pilihan di langkah 2
 * @param props.typesFailed true bila daftar jenis usaha gagal diambil; langkah 2 menampilkan tombol Coba lagi
 * @returns halaman daftar lengkap, atau layar "Akun berhasil dibuat" setelah berhasil
 */
export default function RegisterForm({ types, typesFailed }: { types: MerchantType[]; typesFailed: boolean }) {
  // 1. State langkah, isian, galat, dan fokus. `errorFocusKey` naik setiap kali ada galat, supaya ErrorSummary
  //    memindahkan fokus ke ringkasan galat. `moveFocusRef` menandai bahwa fokus perlu pindah setelah render berikutnya.
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [generalError, setGeneralError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moveFocusRef = useRef(false);
  const router = useRouter();
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [pending, startTransition] = useTransition();

  // 2. Tombol yang diklik hilang saat langkah berganti, jadi fokus dipindah ke judul langkah baru (penting untuk
  //    pengguna keyboard dan pembaca layar).
  useEffect(() => {
    if (!moveFocusRef.current) return;
    moveFocusRef.current = false;
    headingRef.current?.focus();
  }, [step, registered]);

  // 3. Pembantu field: skema validasi langkah aktif, handler onChange, pemeriksaan saat blur, dan gabungan prop Input.
  const schema = step === 1 ? ownerSchema : businessSchema;
  const handleChange = (name: keyof FormValues) => (event: { target: { value: string } }) =>
    setValues((previous) => ({ ...previous, [name]: event.target.value }));
  const validateOnBlur = (name: keyof FormValues) => () =>
    setErrors((previous) => ({ ...previous, [name]: validateFields(schema, values)[name] ?? "" }));
  const fieldProps = (name: keyof FormValues) => ({
    name,
    value: values[name],
    onChange: handleChange(name),
    onBlur: validateOnBlur(name),
  });

  // 4. Simpan galat validasi; true bila ada galat (fokus pindah ke ringkasan galat).
  function hasValidationErrors(fieldErrors: Record<string, string>) {
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length === 0) return false;
    setErrorFocusKey((count) => count + 1);
    return true;
  }

  // 5. Langkah 1 -> 2 setelah data pemilik lolos validasi.
  function goToBusinessStep(event: FormEvent) {
    event.preventDefault();
    setAlreadyRegistered(false);
    if (!hasValidationErrors(validateFields(ownerSchema, values))) {
      moveFocusRef.current = true;
      setStep(2);
    }
  }

  // 6. Kirim pendaftaran.
  function submitRegistration(event: FormEvent) {
    // 1. Cegah muat ulang halaman dan periksa data usaha.
    event.preventDefault();
    setGeneralError("");
    if (hasValidationErrors(validateFields(businessSchema, values))) return;
    // 2. Kirim di dalam transisi (selama itu tombol menampilkan "Memproses…").
    startTransition(async () => {
      // 1. Kirim semua isian kecuali `confirm` ke server action.
      const formData = new FormData();
      for (const [name, value] of Object.entries(values)) if (name !== "confirm") formData.set(name, value);
      const result = await registerMerchant({}, formData);
      // 2. Berhasil -> layar berhasil. Gagal jaringan -> banner umum.
      if (result.ok) {
        moveFocusRef.current = true;
        return setRegistered(true);
      }
      if (result.code === "NETWORK") return setGeneralError(NETWORK_ERROR_MESSAGE);
      // 3. Galat per field dari server.
      const serverErrors = Object.fromEntries(
        Object.entries(result.fields ?? {}).map(([name, messages]) => [name, messages[0]]),
      );
      // 4. 409 (CONFLICT) tanpa rincian field tetap berarti nomor WA atau email sudah dipakai akun lain.
      if (result.code === "CONFLICT" && !serverErrors.phone && !serverErrors.email)
        serverErrors.phone = ALREADY_REGISTERED_MESSAGE;
      if (Object.keys(serverErrors).length === 0)
        return setGeneralError(result.error ?? "Terjadi kesalahan. Coba lagi.");
      // 5. Tampilkan galat; bila ada galat di field pemilik, kembali ke langkah 1 agar field itu terlihat.
      setErrors(serverErrors);
      setErrorFocusKey((count) => count + 1);
      setAlreadyRegistered(result.code === "CONFLICT");
      if (Object.keys(serverErrors).some((name) => OWNER_FIELDS.includes(name))) setStep(1);
    });
  }

  // 7. Ringkasan galat untuk ErrorSummary; id field sama dengan nama field.
  const errorSummary = Object.entries(errors)
    .filter(([, message]) => message)
    .map(([id, message]) => ({ id, message }));

  if (registered) {
    return (
      <AuthFrame>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-success-bg text-success">
            <Check aria-hidden className="size-6" />
          </span>
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-bold outline-none">
            Akun berhasil dibuat
          </h1>
        </div>
        <p className="mt-3 text-ink-muted">
          Toko <strong className="text-ink">{values.business_name}</strong> sudah terdaftar. Siapkan toko Anda dengan
          tiga langkah ini:
        </p>
        <ol className="mt-4 flex flex-col gap-2">
          {SETUP_STEPS.map((stepText, i) => (
            <li key={stepText} className="flex items-center gap-3 rounded-md border border-line px-4 py-3">
              <span
                aria-hidden
                className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
              >
                {i + 1}
              </span>
              <span className="font-medium">{stepText}</span>
            </li>
          ))}
        </ol>
        <LinkButton href="/login?registered=1" size="lg" className="mt-6 w-full">
          Masuk ke dashboard
        </LinkButton>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <h1 className="font-display text-2xl font-bold">Daftar sebagai penjual</h1>
      <ol aria-label="Langkah pendaftaran" className="mt-4 flex gap-2">
        {["Data pemilik", "Data usaha"].map((label, i) => (
          <li
            key={label}
            aria-current={step === i + 1 ? "step" : undefined}
            className={`flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm ${step === i + 1 ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line text-ink-muted"}`}
          >
            <span aria-hidden className="font-mono">
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <form onSubmit={goToBusinessStep} noValidate className="mt-6 flex flex-col gap-4">
          <h2 ref={headingRef} tabIndex={-1} className="sr-only">
            Data pemilik
          </h2>
          <ErrorSummary errors={errorSummary} focusKey={errorFocusKey} />
          {alreadyRegistered && (
            <Banner
              tone="warning"
              action={
                <Link href="/login" className="inline-flex min-h-11 items-center font-semibold underline">
                  Masuk
                </Link>
              }
            >
              Nomor WA atau email ini sudah terdaftar. Sudah punya akun?
            </Banner>
          )}
          <Field label="Nama lengkap" required error={errors.full_name} id="full_name">
            <Input {...fieldProps("full_name")} autoComplete="name" />
          </Field>
          <Field
            label="Nomor WA"
            required
            help="Dipakai untuk masuk dan dihubungi pembeli. Contoh: 081234567890"
            error={errors.phone}
            id="phone"
          >
            <Input {...fieldProps("phone")} type="tel" inputMode="numeric" autoComplete="tel" />
          </Field>
          <Field label="Email (opsional)" error={errors.email} id="email">
            <Input {...fieldProps("email")} type="email" autoComplete="email" />
          </Field>
          <div className="relative">
            <Field
              label="Kata sandi"
              required
              help="Minimal 8 karakter, berisi huruf dan angka."
              error={errors.password}
              id="password"
            >
              <Input
                {...fieldProps("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="pr-12"
              />
            </Field>
            <IconButton
              icon={showPassword ? EyeOff : Eye}
              label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
              className="absolute right-0 top-[26px]"
            />
          </div>
          <div className="relative">
            <Field label="Konfirmasi kata sandi" required error={errors.confirm} id="confirm">
              <Input
                {...fieldProps("confirm")}
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                className="pr-12"
              />
            </Field>
            <IconButton
              icon={showConfirm ? EyeOff : Eye}
              label={showConfirm ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
              aria-pressed={showConfirm}
              onClick={() => setShowConfirm((shown) => !shown)}
              className="absolute right-0 top-[26px]"
            />
          </div>
          <Button type="submit" size="lg">
            Lanjut
          </Button>
        </form>
      ) : (
        <form onSubmit={submitRegistration} noValidate className="mt-6 flex flex-col gap-4">
          <h2 ref={headingRef} tabIndex={-1} className="sr-only">
            Data usaha
          </h2>
          <ErrorSummary errors={errorSummary} focusKey={errorFocusKey} />
          {generalError && <Banner tone="danger">{generalError}</Banner>}
          <Field label="Nama usaha" required error={errors.business_name} id="business_name">
            <Input {...fieldProps("business_name")} />
          </Field>
          {typesFailed ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Jenis usaha</span>
              <Banner
                tone="danger"
                action={
                  <Button variant="secondary" onClick={() => router.refresh()}>
                    Coba lagi
                  </Button>
                }
              >
                Daftar jenis usaha gagal dimuat.
              </Banner>
            </div>
          ) : (
            <Field label="Jenis usaha" required error={errors.merchant_type_id} id="merchant_type_id">
              <Select {...fieldProps("merchant_type_id")}>
                <option value="">Pilih jenis usaha</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Alamat" required error={errors.address} id="address">
            <Input {...fieldProps("address")} autoComplete="street-address" />
          </Field>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setErrors({});
                setGeneralError("");
                moveFocusRef.current = true;
                setStep(1);
              }}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              loading={pending}
              loadingText="Memproses…"
              disabled={typesFailed}
            >
              Daftar
            </Button>
          </div>
        </form>
      )}
    </AuthFrame>
  );
}

/**
 * Bingkai halaman daftar: logo di atas, kartu berisi `children`, dan tautan "Sudah punya akun? Masuk" di bawah.
 * @param props.children isi kartu (formulir atau layar berhasil)
 * @returns elemen `<main>` halaman daftar
 */
function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <Link
        href="/"
        aria-label="KateringKita, ke beranda"
        className="self-start rounded-md focus-visible:ring-2 focus-visible:ring-focus"
      >
        <Brand />
      </Link>
      <div className="rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">{children}</div>
      <p className="text-center text-sm text-ink-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-primary underline">
          Masuk
        </Link>
      </p>
    </main>
  );
}
