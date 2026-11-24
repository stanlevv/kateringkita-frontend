// Komponen SettingsForm: seluruh isi /pengaturan. Bagian Profil, Operasional, dan Titik temu adalah satu formulir yang
// disimpan bersama lewat server action saveProfile (app/actions/profile.ts) dengan bilah "Simpan perubahan" yang
// menempel di bawah. Bagian Pembayaran (PayoutBankAccount), Pesan dari meja (TableOrderSettings), dan Akun
// (ChangePasswordForm) menyimpan sendiri-sendiri. Logo dan background diunggah langsung dari peramban (lib/upload.ts).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { callAction } from "@/lib/action";
import { saveProfile } from "@/app/actions/profile";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { cx, focusRing } from "@/app/components/ui/cx";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { FileDrop } from "@/app/components/ui/FileDrop";
import { Input, Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { useUnsavedGuard } from "@/hooks/useUnsavedGuard";
import { uploadPhoto } from "@/lib/upload";
import { validateProfile } from "@/lib/schemas";
import type { MerchantProfile } from "@/types/profile";
import type { PickupPoint } from "@/types/meta";
import type { Table } from "@/types/table";
import type { MyPayouts } from "@/types/payout";
import { ChangePasswordForm } from "@/app/components/ChangePasswordForm";
import { TableOrderSettings } from "./TableOrderSettings";
import { PickupPointPicker } from "./PickupPointPicker";
import { PayoutBankAccount } from "./PayoutBankAccount";
import { AccountForm } from "./AccountForm";
import { EmailVerification } from "./EmailVerification";

/** Bagian halaman; `id` juga dipakai sebagai #hash tautan dan nilai ?lengkapi=, jadi tidak boleh diganti. */
const SECTIONS = [
  { id: "profil", title: "Profil toko" },
  { id: "operasional", title: "Operasional" },
  { id: "titik-temu", title: "Titik temu" },
  { id: "pembayaran", title: "Pembayaran & pencairan" },
  { id: "meja", title: "Pesan dari meja" },
  { id: "akun", title: "Akun" },
] as const;
/** Pilihan mode layanan (nilai = service_mode di API). */
const SERVICE_MODES = [
  { value: "daily", label: "Harian", description: "Porsi satuan yang dijual setiap hari." },
  { value: "event", label: "Acara", description: "Pesanan besar yang dipesan lebih dulu." },
  { value: "both", label: "Keduanya", description: "Harian dan acara sekaligus." },
] as const;
/** Nama isian untuk ringkasan galat (kunci = nama field API). */
const FIELD_LABELS: Record<string, string> = {
  business_name: "Nama usaha",
  description: "Deskripsi",
  address: "Alamat",
  wa_number: "Nomor WA toko",
  open_time: "Jam buka",
  close_time: "Jam tutup",
  hold_minutes: "Durasi tahan pesanan",
  logo_url: "Logo toko",
  cover_url: "Background toko",
  daily_revenue_target: "Target omzet harian",
  pickup_point_ids: "Titik temu",
};
const MEGABYTE = 1024 * 1024;
/** Teks isian menjadi angka; isian kosong menjadi NaN supaya validasi menganggapnya belum diisi. */
const toNumber = (text: string) => (text.trim() === "" ? NaN : Number(text));

/** Isi formulir profil (kunci = nama field API); angka disimpan sebagai teks isian. */
type ProfileFormValues = {
  business_name: string;
  description: string;
  address: string;
  wa_number: string;
  service_mode: MerchantProfile["service_mode"];
  open_time: string;
  close_time: string;
  hold_minutes: string;
  daily_revenue_target: string;
  pickup_point_ids: number[];
  logo_url: string | null;
  cover_url: string | null;
};

/** Isi formulir dari profil toko di backend. */
const toFormValues = (merchantProfile: MerchantProfile): ProfileFormValues => ({
  business_name: merchantProfile.business_name,
  description: merchantProfile.description ?? "",
  address: merchantProfile.address,
  wa_number: merchantProfile.wa_number,
  service_mode: merchantProfile.service_mode,
  open_time: merchantProfile.open_time,
  close_time: merchantProfile.close_time,
  hold_minutes: String(merchantProfile.hold_minutes),
  daily_revenue_target: String(merchantProfile.daily_revenue_target),
  pickup_point_ids: merchantProfile.pickup_point_ids,
  logo_url: merchantProfile.logo_url,
  cover_url: merchantProfile.cover_url ?? null,
});
// Isi formulir sebagai teks untuk mendeteksi perubahan; urutan titik temu tidak dianggap perubahan.
const compareKey = (values: ProfileFormValues) =>
  JSON.stringify({ ...values, pickup_point_ids: [...values.pickup_point_ids].sort((first, second) => first - second) });

/**
 * Satu bagian berjudul. Judul bisa menerima fokus agar bagian yang dituju ?lengkapi= dibacakan pembaca layar.
 * @param props.id id bagian (juga #hash tautan)
 * @param props.title judul bagian
 * @param props.highlighted true = diberi cincin sorot sementara
 * @param props.children isi bagian
 * @returns elemen section
 */
function Section({
  id,
  title,
  highlighted,
  children,
}: {
  id: string;
  title: string;
  highlighted: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-judul`}
      className={cx(
        "flex scroll-mt-24 flex-col gap-4 rounded-lg border border-line bg-surface p-4 transition-shadow duration-200 motion-reduce:transition-none sm:p-6",
        highlighted && "ring-2 ring-info",
      )}
    >
      <h2 id={`${id}-judul`} tabIndex={-1} className="text-lg font-semibold text-ink outline-none">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Tampilan per jenis gambar: nama, ukuran bingkai, cara gambar mengisi bingkai, dan ukuran untuk next/image. */
const IMAGE_KINDS = {
  logo: { name: "Logo toko", frameClass: "aspect-square w-40", fitClass: "object-contain", sizes: "160px" },
  // background profil toko tampil melebar di atas halaman toko aplikasi
  cover: {
    name: "Background toko",
    frameClass: "aspect-[3/1] w-full max-w-md",
    fitClass: "object-cover",
    sizes: "448px",
  },
} as const;

/**
 * Isian logo atau background toko: pratinjau, unggah langsung dari peramban ke penyimpanan, dan hapus. Selama
 * unggahan berjalan, induk diberi tahu lewat onBusy supaya tombol Simpan menunggu. (Unggah gambar QRIS toko sudah
 * dihapus karena pembayaran online lewat Midtrans.)
 * @param props.id id isian, dipakai tautan ringkasan galat
 * @param props.kind "logo" atau "cover" (juga jenis unggahan di lib/upload.ts)
 * @param props.url alamat gambar sekarang, null bila belum ada
 * @param props.error galat dari validasi formulir
 * @param props.onChange dipanggil dengan alamat baru, atau null saat dihapus
 * @param props.onBusy dipanggil true saat unggah mulai dan false saat selesai atau batal
 * @returns grup isian gambar
 */
function ImageField({
  id,
  kind = "logo",
  url,
  error,
  onChange,
  onBusy,
}: {
  id: string;
  kind?: keyof typeof IMAGE_KINDS;
  url: string | null;
  error?: string;
  onChange: (newUrl: string | null) => void;
  onBusy: (busy: boolean) => void;
}) {
  // 1. Tampilan jenis gambar dan state unggahan. uploadToken menandai unggahan terbaru, jadi respons lama diabaikan.
  const imageKind = IMAGE_KINDS[kind];
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const uploadToken = useRef(0); // token unggahan terbaru; respons lama diabaikan
  const uploadRunning = useRef(false);
  const container = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  // 2. Tombol Hapus hilang bersama gambar; fokus dipindah ke tombol pilih berkas.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    container.current?.querySelector("button")?.focus();
  }, [url]);
  // 3. Pindah ke bagian lain (Hapus, pilih ulang, atau form direset): unggahan yang masih jalan dibatalkan.
  function cancelUpload() {
    uploadToken.current++;
    if (uploadRunning.current) {
      uploadRunning.current = false;
      setUploading(false);
      onBusy(false);
    }
  }
  // 4. Saat isian dilepas (form direset dengan key baru), respons unggahan yang masih berjalan diabaikan.
  useEffect(
    () => () => {
      uploadToken.current++;
    },
    [],
  ); // form direset (key baru): respons lama diabaikan
  // 5. Unggah berkas yang dipilih.
  async function chooseFile(file: File) {
    // 1. Batalkan unggahan sebelumnya dan catat token unggahan ini.
    cancelUpload();
    const token = uploadToken.current;
    setUploadError(null);
    setUploaded(false);
    uploadRunning.current = true;
    setUploading(true);
    onBusy(true);
    // 2. Unggah; hasil diabaikan bila sudah ada unggahan yang lebih baru atau unggahan dibatalkan.
    const result = await uploadPhoto(file, kind);
    if (token !== uploadToken.current) return;
    uploadRunning.current = false;
    setUploading(false);
    onBusy(false);
    if ("error" in result) return setUploadError(result.error.message);
    setUploaded(true);
    onChange(result.data.public_url);
  }
  const message = uploadError ?? error;
  return (
    <div role="group" aria-label={imageKind.name} className="flex flex-col gap-3">
      {url ? (
        <div className={cx("relative overflow-hidden rounded-md bg-subtle", imageKind.frameClass)}>
          <Image
            src={url}
            alt={imageKind.name}
            fill
            unoptimized
            sizes={imageKind.sizes}
            className={imageKind.fitClass}
          />
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Belum ada gambar.</p>
      )}
      {uploading && (
        <p role="status" className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          Mengunggah…
        </p>
      )}
      {uploaded && !uploading && (
        <p role="status" className="text-sm text-success">
          {kind === "logo" ? "Logo" : "Background"} terunggah.
        </p>
      )}
      {message && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <TriangleAlert aria-hidden className="size-4" />
          {message}
        </p>
      )}
      <div ref={container}>
        <FileDrop
          id={id}
          maxBytes={20 * MEGABYTE /* diperkecil di lib/upload.ts */}
          onFile={(file) => void chooseFile(file)}
          onError={setUploadError}
          label={`${url ? "Ganti" : "Pilih"} ${kind === "logo" ? "logo" : "background"}`}
        />
      </div>
      {url && (
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              cancelUpload();
              moveFocus.current = true;
              setUploadError(null);
              setUploaded(false);
              onChange(null);
            }}
          >
            <X aria-hidden className="size-4" />
            Hapus gambar
          </Button>
        </div>
      )}
    </div>
  );
}

/** Prop SettingsForm. */
type Props = {
  profile: MerchantProfile;
  pickupPoints: PickupPoint[] | null;
  user: { full_name: string; phone: string; email: string; email_verified: boolean };
  incompleteSection?: string;
  tables?: Table[] | null; // meja untuk pesan dari meja; tidak diisi = daftar kosong
  payouts?: MyPayouts | null; // data pencairan; null = gagal dimuat
};

/**
 * Formulir pengaturan toko lengkap dengan navigasi bagian, ringkasan galat, bilah simpan menempel, dan penjaga
 * perubahan belum disimpan (useUnsavedGuard).
 * @param props.profile profil toko dari backend
 * @param props.pickupPoints semua titik temu, null = gagal dimuat
 * @param props.user nama, nomor WA, email, dan status verifikasi email akun yang masuk
 * @param props.incompleteSection id bagian dari ?lengkapi= yang digulir dan disorot 3 detik
 * @param props.tables meja untuk pesan dari meja, null = gagal dimuat
 * @param props.payouts saldo, rekening, dan riwayat pencairan, null = gagal dimuat
 * @returns navigasi bagian, formulir, bagian yang tersimpan sendiri, dan dialog buang perubahan
 */
export function SettingsForm({ profile, pickupPoints, user, incompleteSection, tables = [], payouts = null }: Props) {
  // 1. State formulir: isi awal (acuan "ada perubahan"), isi sekarang, isian disentuh, galat server, dan status simpan
  //    atau unggah. resetCount dipakai sebagai key ImageField supaya Batalkan memasang ulang isian gambar.
  const [initialValues, setInitialValues] = useState(() => toFormValues(profile));
  const [values, setValues] = useState<ProfileFormValues>(initialValues);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const router = useRouter();
  const [highlightedSection, setHighlightedSection] = useState<string | null>(() =>
    SECTIONS.some((section) => section.id === incompleteSection) ? incompleteSection! : null,
  );

  // 2. Dari kartu "Siapkan toko": gulir ke bagian yang belum lengkap, fokuskan judulnya, dan sorot 3 detik.
  useEffect(() => {
    const sectionElement = SECTIONS.some((section) => section.id === incompleteSection)
      ? document.getElementById(incompleteSection!)
      : null;
    if (!sectionElement) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    sectionElement.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    sectionElement.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    const timer = setTimeout(() => setHighlightedSection(null), 3000);
    return () => clearTimeout(timer);
  }, [incompleteSection]);

  // 3. Ada perubahan? useUnsavedGuard memasang penjaga saat meninggalkan halaman.
  const dirty = compareKey(values) !== compareKey(initialValues);
  const guard = useUnsavedGuard(dirty);

  // 4. Pengubah isian; setiap perubahan menghapus galat server lama.
  const setField = <K extends keyof ProfileFormValues>(field: K, value: ProfileFormValues[K]) => {
    setServerErrors({});
    setValues((previous) => ({ ...previous, [field]: value }));
  };
  const markTouched = (field: string) => setTouched((previous) => new Set(previous).add(field));
  const blurHandler = (field: string) => () => markTouched(field);
  // 5. Data yang dikirim (nama field = kontrak API), galat validasi, dan ringkasannya. Galat per isian baru tampil
  //    setelah isian disentuh atau setelah mencoba menyimpan.
  const input = {
    business_name: values.business_name,
    description: values.description,
    logo_url: values.logo_url,
    cover_url: values.cover_url,
    address: values.address,
    wa_number: values.wa_number,
    service_mode: values.service_mode,
    open_time: values.open_time,
    close_time: values.close_time,
    hold_minutes: toNumber(values.hold_minutes),
    daily_revenue_target: toNumber(values.daily_revenue_target),
    pickup_point_ids: values.pickup_point_ids,
  };
  const clientErrors = validateProfile(input);
  const allErrors = submitAttempted ? { ...serverErrors, ...clientErrors } : clientErrors;
  const fieldError = (field: string) => (submitAttempted || touched.has(field) ? allErrors[field] : undefined);
  const errorSummary = submitAttempted
    ? Object.entries(allErrors).map(([field, message]) => ({
        id: `pg-${field}`,
        message: `${FIELD_LABELS[field] ?? field}: ${message}`,
      }))
    : [];

  // 6. Batalkan perubahan: kembali ke isi awal.
  function cancelChanges() {
    setResetCount((count) => count + 1); // pasang ulang ImageField: unggahan yang berjalan dibatalkan
    setUploadingCount(0);
    setValues(initialValues);
    setServerErrors({});
    setTouched(new Set());
    setSubmitAttempted(false);
  }

  // 7. Simpan formulir.
  async function submit(event: React.FormEvent) {
    // 1. Jangan simpan tanpa perubahan atau saat unggahan berjalan; galat validasi memindahkan fokus ke ringkasan.
    event.preventDefault();
    if (!dirty || uploadingCount > 0) return; // Enter di dalam kolom tidak boleh menyimpan tanpa perubahan atau saat unggahan berjalan
    if (Object.keys(clientErrors).length > 0) {
      setSubmitAttempted(true);
      setErrorFocusKey((count) => count + 1);
      return;
    }
    // 2. Kirim sekali saja; galat per isian dari server dipetakan ke isian, galat umum menjadi toast.
    if (saving) return;
    setSaving(true);
    const result = await callAction(() => saveProfile(input));
    setSaving(false);
    if ("error" in result) {
      if (result.error.fields) {
        setServerErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
        setSubmitAttempted(true);
        setErrorFocusKey((count) => count + 1);
      } else {
        toast({ tone: "danger", message: result.error.message });
      }
      return;
    }
    // 3. Berhasil: isi dari server menjadi acuan baru.
    const savedValues = toFormValues(result.data); // bentuk resmi dari server (mis. deskripsi kosong -> null)
    setInitialValues(savedValues);
    setValues(savedValues);
    setSubmitAttempted(false);
    setTouched(new Set());
    toast({ tone: "success", message: "Pengaturan disimpan" });
    router.refresh(); // status buka/tutup di bilah atas mengikuti jam baru
  }

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <nav aria-label="Bagian pengaturan" className="lg:sticky lg:top-6">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={cx(
                    "inline-flex min-h-11 items-center rounded-md px-3 font-medium text-ink hover:bg-subtle",
                    focusRing,
                  )}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          <form id="pg-form" onSubmit={submit} noValidate className="flex flex-col gap-6">
            <ErrorSummary errors={errorSummary} focusKey={errorFocusKey} />

            <Section id="profil" title="Profil toko" highlighted={highlightedSection === "profil"}>
              <Field label="Nama usaha" id="pg-business_name" required error={fieldError("business_name")}>
                <Input
                  value={values.business_name}
                  maxLength={150}
                  onChange={(event) => setField("business_name", event.target.value)}
                  onBlur={blurHandler("business_name")}
                />
              </Field>
              <Field
                label="Deskripsi"
                id="pg-description"
                help={`${values.description.length}/500 karakter`}
                error={fieldError("description")}
              >
                <Textarea
                  value={values.description}
                  onChange={(event) => setField("description", event.target.value)}
                  onBlur={blurHandler("description")}
                />
              </Field>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-ink">Logo toko</p>
                <ImageField
                  key={`logo-${resetCount}`}
                  id="pg-logo_url"
                  url={values.logo_url}
                  error={fieldError("logo_url")}
                  onChange={(newUrl) => setField("logo_url", newUrl)}
                  onBusy={(busy) => setUploadingCount((count) => count + (busy ? 1 : -1))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-ink">Background toko</p>
                <p className="text-sm text-ink-muted">
                  Tampil melebar di atas halaman toko di aplikasi pembeli. Pakai foto lanskap, misalnya dapur atau
                  etalase.
                </p>
                <ImageField
                  key={`cover-${resetCount}`}
                  id="pg-cover_url"
                  kind="cover"
                  url={values.cover_url}
                  error={fieldError("cover_url")}
                  onChange={(newUrl) => setField("cover_url", newUrl)}
                  onBusy={(busy) => setUploadingCount((count) => count + (busy ? 1 : -1))}
                />
              </div>
              <Field label="Alamat" id="pg-address" required error={fieldError("address")}>
                <Input
                  value={values.address}
                  maxLength={255}
                  onChange={(event) => setField("address", event.target.value)}
                  onBlur={blurHandler("address")}
                />
              </Field>
              <Field
                label="Nomor WA toko"
                id="pg-wa_number"
                required
                help="Pesanan masuk ke nomor ini. Contoh: 081234567890"
                error={fieldError("wa_number")}
              >
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={values.wa_number}
                  onChange={(event) => setField("wa_number", event.target.value.replace(/\D/g, ""))}
                  onBlur={blurHandler("wa_number")}
                />
              </Field>
            </Section>

            <Section id="operasional" title="Operasional" highlighted={highlightedSection === "operasional"}>
              <fieldset className="flex flex-col">
                <legend className="mb-1 text-sm font-medium text-ink">Mode layanan</legend>
                {SERVICE_MODES.map((mode) => (
                  <label key={mode.value} className="flex min-h-11 cursor-pointer items-center gap-3 text-ink">
                    <input
                      type="radio"
                      name="service_mode"
                      value={mode.value}
                      checked={values.service_mode === mode.value}
                      onChange={() => setField("service_mode", mode.value)}
                      className={cx("size-5 accent-primary", focusRing)}
                    />
                    <span>
                      {mode.label} <span className="text-sm text-ink-muted">· {mode.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Jam buka" id="pg-open_time" required error={fieldError("open_time")}>
                  <Input
                    type="time"
                    value={values.open_time}
                    onChange={(event) => setField("open_time", event.target.value)}
                    onBlur={blurHandler("open_time")}
                  />
                </Field>
                <Field
                  label="Jam tutup"
                  id="pg-close_time"
                  required
                  help="Harus setelah jam buka."
                  error={fieldError("close_time")}
                >
                  <Input
                    type="time"
                    value={values.close_time}
                    onChange={(event) => setField("close_time", event.target.value)}
                    onBlur={blurHandler("close_time")}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Durasi tahan pesanan (menit)"
                  id="pg-hold_minutes"
                  required
                  help="Batas waktu pesanan baru menunggu konfirmasi Anda (tunai) atau pembayaran pembeli (VA, bayar online). Lewat batas, pesanan batal otomatis dan stok kembali. 1 sampai 30 menit."
                  error={fieldError("hold_minutes")}
                >
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={30}
                    step={1}
                    value={values.hold_minutes}
                    onChange={(event) => setField("hold_minutes", event.target.value)}
                    onBlur={blurHandler("hold_minutes")}
                  />
                </Field>
                <Field
                  label="Target omzet harian (Rp)"
                  id="pg-daily_revenue_target"
                  help="Isi 0 bila tidak memakai target."
                  error={fieldError("daily_revenue_target")}
                >
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={values.daily_revenue_target}
                    onChange={(event) => setField("daily_revenue_target", event.target.value)}
                    onBlur={blurHandler("daily_revenue_target")}
                  />
                </Field>
              </div>
            </Section>

            <Section id="titik-temu" title="Titik temu" highlighted={highlightedSection === "titik-temu"}>
              <p className="text-ink-muted">Pilih tempat pembeli bisa mengambil pesanan. Minimal satu.</p>
              <PickupPointPicker
                points={pickupPoints}
                value={values.pickup_point_ids}
                onChange={(ids) => setField("pickup_point_ids", ids)}
                onBlur={blurHandler("pickup_point_ids")}
                error={pickupPoints ? fieldError("pickup_point_ids") : undefined}
              />
            </Section>
          </form>

          {/* di luar form utama: aksinya tersimpan langsung, tidak ikut "Simpan perubahan" */}
          <Section id="pembayaran" title="Pembayaran & pencairan" highlighted={highlightedSection === "pembayaran"}>
            <PayoutBankAccount data={payouts} />
          </Section>

          <Section id="meja" title="Pesan dari meja" highlighted={highlightedSection === "meja"}>
            <TableOrderSettings initialEnabled={profile.dine_in_enabled} initialTables={tables} />
          </Section>

          <Section id="akun" title="Akun" highlighted={highlightedSection === "akun"}>
            <div className="flex flex-col gap-8">
              <AccountForm fullName={user.full_name} phone={user.phone} />
              <EmailVerification email={user.email} verified={user.email_verified} />
            </div>
            <ChangePasswordForm />
          </Section>

          {dirty && (
            <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-end gap-3 rounded-lg border border-line bg-surface p-3 shadow-lg">
              <p className="mr-auto text-ink-muted">Ada perubahan yang belum disimpan.</p>
              <Button variant="secondary" onClick={cancelChanges} disabled={saving}>
                Batalkan perubahan
              </Button>
              <Button
                type="submit"
                form="pg-form"
                loading={saving}
                loadingText="Menyimpan…"
                disabled={uploadingCount > 0}
              >
                Simpan perubahan
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={guard.open}
        onClose={guard.cancel}
        title="Buang perubahan?"
        body="Perubahan pada pengaturan ini belum disimpan."
        confirmLabel="Buang perubahan"
        cancelLabel="Tetap di sini"
        tone="danger"
        onConfirm={guard.confirm}
      />
    </>
  );
}
