// Aturan validasi form (memakai pustaka zod) untuk login, daftar, lupa sandi, menu, pengaturan toko, dan promo.
// Aturannya disamakan dengan backend, sehingga galat sudah tampil di browser sebelum dikirim.
// Fungsi validate* dipakai form di browser dan server action, jadi pemeriksaannya satu pintu.

import { z } from "zod";
import { formatRupiah } from "./format";
import { validateTemplate } from "./wa-template";

// --- Masuk dan daftar: aturan sama dengan be/src/auth/schemas.ts ---
const requiredText = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, `Maksimal ${max} karakter.`);

/** Form masuk: email atau nomor WA, dan kata sandi. */
export const loginSchema = z.object({
  identifier: requiredText("Email atau nomor WA wajib diisi.", 255),
  password: z.string().min(1, "Kata sandi wajib diisi.").max(72, "Kata sandi maksimal 72 karakter."),
});

const waNumber = z.string().regex(/^08\d{8,11}$/, "Nomor WA harus diawali 08 dan 10–13 digit.");

/** Aturan kata sandi baru: 8–72 karakter, ada huruf dan angka. */
export const newPasswordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(72, "Kata sandi maksimal 72 karakter.")
  .regex(/[A-Za-z]/, "Kata sandi harus mengandung huruf.")
  .regex(/\d/, "Kata sandi harus mengandung angka.");

/** Form daftar langkah 1 (data pemilik), termasuk konfirmasi kata sandi harus sama. */
export const ownerSchema = z
  .object({
    full_name: requiredText("Nama lengkap wajib diisi.", 150),
    phone: waNumber,
    email: z
      .string()
      .trim()
      .refine((email) => email === "" || z.email().safeParse(email).success, "Format email tidak valid."),
    password: newPasswordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Konfirmasi kata sandi tidak sama.",
  });

/** Form daftar langkah 2 (data usaha). */
export const businessSchema = z.object({
  business_name: requiredText("Nama usaha wajib diisi.", 150),
  merchant_type_id: z.string().min(1, "Jenis usaha wajib dipilih."),
  address: requiredText("Alamat wajib diisi.", 255),
});

// --- Akun (Pengaturan > Akun): aturan sama dengan backend PATCH /me dan /me/email/* ---
const emailField = z.string().trim().min(1, "Email wajib diisi.").pipe(z.email("Format email tidak valid."));
const currentPasswordField = z.string().min(1, "Kata sandi saat ini wajib diisi.").max(72, "Maksimal 72 karakter.");
/** Kode OTP dari email: tepat 6 angka. */
export const otpCodeSchema = z.string().regex(/^\d{6}$/, "Kode berisi 6 angka.");

/** Form data akun: nama pemilik dan nomor WA login. Sandi saat ini dicek terpisah (hanya wajib bila nomor berubah). */
export const accountSchema = z.object({
  full_name: requiredText("Nama lengkap wajib diisi.", 150),
  phone: waNumber,
});

/** Form ganti email: email baru dan kata sandi saat ini. */
export const emailChangeSchema = z.object({ email: emailField, current_password: currentPasswordField });

/** Form lupa sandi: email tujuan kode reset. */
export const emailResetSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi.").pipe(z.email("Format email tidak valid.")),
});

/** Form reset sandi: kode 6 angka dan kata sandi baru. */
export const resetPasswordSchema = z
  .object({
    code: otpCodeSchema,
    password: newPasswordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Konfirmasi kata sandi tidak sama.",
  });

// --- Menu: aturan sama dengan API.md POST /merchant/menus ---
const integerField = (label: string, min: number, max?: number) => {
  const schema = z
    .number({ error: `${label} wajib diisi.` })
    .int(`${label} harus bilangan bulat.`)
    .min(min, `${label} minimal ${min.toLocaleString("id-ID")}.`);
  return max === undefined ? schema : schema.max(max, `${label} maksimal ${max.toLocaleString("id-ID")}.`);
};

const menuFormObject = z.object({
  name: requiredText("Nama menu wajib diisi.", 80),
  category_id: z.number({ error: "Kategori wajib dipilih." }).int().min(1, "Kategori wajib dipilih."),
  description: z.string().trim().max(500, "Maksimal 500 karakter."),
  image_url: z.string().nullable(),
  gallery: z.array(z.string()).max(4, "Maksimal 4 foto tambahan.").default([]),
  unit_label: requiredText("Satuan wajib diisi.", 30),
  price: integerField("Harga jual", 1000, 100_000_000),
  hpp: integerField("HPP", 0, 100_000_000),
  daily_quota: integerField("Kuota harian", 0, 10_000),
  prep_minutes: integerField("Estimasi siap", 1, 1440),
  is_preorder: z.boolean(),
  preorder_days: z.number({ error: "Hari pre-order wajib diisi." }).int("Hari pre-order harus bilangan bulat."),
  min_order_qty: integerField("Minimum pesan", 1, 1000),
  options: z
    .array(
      z.object({
        name: requiredText("Nama opsi wajib diisi.", 60),
        extra_price: integerField("Tambahan harga", 0, 1_000_000),
      }),
    )
    .max(20, "Maksimal 20 opsi."),
});

/**
 * Form tambah/ubah menu, termasuk aturan antar-field (harga jual di atas HPP, hari pre-order 1–7, nama opsi tidak kembar).
 */
export const menuFormSchema = menuFormObject.check(crossFieldRules());

// Aturan antar-field harus tetap jalan walau field lain salah tipe (mis. kategori belum dipilih),
// jadi `when` dipaksa true dan data dibaca defensif.
function crossFieldRules() {
  const rules = z.superRefine((data: z.infer<typeof menuFormObject>, context) => {
    if (typeof data !== "object" || data === null) return; // input server action bisa apa saja; galat tipe sudah dilaporkan
    // 1. Harga jual harus di atas HPP.
    if (Number.isFinite(data.price) && Number.isFinite(data.hpp) && data.price <= data.hpp)
      context.addIssue({
        code: "custom",
        path: ["price"],
        message: `Harga jual harus lebih besar dari HPP (${formatRupiah(data.hpp)}).`,
      });
    // 2. Menu pre-order harus punya 1–7 hari pemesanan.
    if (data.is_preorder && !(data.preorder_days >= 1 && data.preorder_days <= 7))
      context.addIssue({ code: "custom", path: ["preorder_days"], message: "Hari pre-order harus 1 sampai 7." });
    // 3. Nama opsi tidak boleh kembar (huruf besar/kecil diabaikan).
    const seenNames = new Set<string>();
    (Array.isArray(data.options) ? data.options : []).forEach((option, i) => {
      const name = typeof option?.name === "string" ? option.name.trim().toLowerCase() : "";
      if (name && seenNames.has(name))
        context.addIssue({ code: "custom", path: ["options", i, "name"], message: "Nama opsi sama dengan opsi lain." });
      seenNames.add(name);
    });
  });
  // 4. Paksa aturan ini tetap dijalankan walau field lain sudah salah.
  rules._zod.def.when = () => true;
  return rules;
}

/**
 * Menjalankan sebuah schema dan mengambil pesan pertama per field.
 * @param schema aturan zod
 * @param value isian yang diperiksa
 * @returns pesan per field dengan nama field bertitik (mis. "options.1.name"); objek kosong bila valid
 */
export function validateFields(schema: z.ZodType, value: unknown): Record<string, string> {
  const result = schema.safeParse(value);
  const errors: Record<string, string> = {};
  if (!result.success) for (const issue of result.error.issues) errors[issue.path.join(".")] ??= issue.message;
  return errors;
}

// --- Pengaturan toko: aturan sama dengan API.md PATCH /merchant/profile ---
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam harus berformat JJ:MM.");
const profileFields = {
  business_name: requiredText("Nama usaha wajib diisi.", 150),
  description: z.string().trim().max(500, "Maksimal 500 karakter."),
  logo_url: z.string().nullable(),
  cover_url: z.string().nullable().optional(),
  address: requiredText("Alamat wajib diisi.", 255),
  wa_number: waNumber,
  service_mode: z.enum(["daily", "event", "both"], { error: "Pilih mode layanan." }),
  open_time: timeOfDay,
  close_time: timeOfDay,
  hold_minutes: integerField("Durasi tahan pesanan", 1, 30),
  daily_revenue_target: integerField("Target omzet", 0, 1_000_000_000),
  pickup_point_ids: z.array(z.number().int()).min(1, "Pilih minimal satu titik temu."),
};
const fullProfileSchema = z.object(profileFields);
const partialProfileSchema = z
  .object({
    ...profileFields,
    wa_template: z.string().superRefine((template, context) => {
      const error = validateTemplate(template);
      if (error) context.addIssue({ code: "custom", message: error });
    }),
  })
  .partial();

/**
 * Memeriksa form pengaturan toko. Dipakai form (isian lengkap) dan server action (lengkap atau sebagian, mis. hanya wa_template).
 * @param value isian
 * @param full true bila semua field wajib ada
 * @returns pesan per field; objek kosong bila valid
 */
export function validateProfile(value: unknown, full = true): Record<string, string> {
  // 1. Periksa tiap field dengan schema (lengkap atau sebagian).
  const errors = validateFields(full ? fullProfileSchema : partialProfileSchema, value);
  // 2. Aturan antar-jam dicek terpisah agar tetap muncul walau field lain salah.
  const input = value as { open_time?: unknown; close_time?: unknown } | null;
  if (
    typeof input?.open_time === "string" &&
    typeof input.close_time === "string" &&
    !errors.close_time &&
    !errors.open_time &&
    input.close_time <= input.open_time
  ) {
    errors.close_time = "Jam tutup harus setelah jam buka.";
  }
  return errors;
}

/**
 * Mengambil hanya field profil yang boleh diubah, sudah dirapikan (spasi di ujung dibuang). Panggil setelah `validateProfile` kosong.
 * @param value isian
 * @param full true bila isian lengkap
 * @returns field profil yang sudah dirapikan, siap dikirim ke backend
 * @throws galat zod bila isian tidak valid
 */
export function parseProfile(value: unknown, full = true) {
  return (full ? fullProfileSchema : partialProfileSchema).parse(value);
}

/** Form ganti sandi: sandi lama dan sandi baru yang harus berbeda. */
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Kata sandi lama wajib diisi.").max(72, "Kata sandi maksimal 72 karakter."),
    new_password: newPasswordSchema,
  })
  .refine((data) => data.current_password !== data.new_password, {
    path: ["new_password"],
    message: "Kata sandi baru harus berbeda dari kata sandi lama.",
  });

// --- Promo: aturan sama dengan API.md POST/PATCH /merchant/promos ---
const dateTimeField = (message: string) =>
  z.string({ error: message }).refine((text) => text !== "" && !Number.isNaN(Date.parse(text)), message);
const promoFormSchema = z.object({
  code: z
    .string({ error: "Kode wajib diisi." })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,30}$/, "Kode 3–30 huruf besar atau angka."),
  description: z.string().trim().max(255, "Maksimal 255 karakter."),
  type: z.enum(["percent", "fixed", "free_service_fee"], { error: "Pilih jenis promo." }),
  value: z.number({ error: "Nilai wajib diisi." }).int("Nilai harus bilangan bulat."),
  max_discount: integerField("Maks potongan", 1).nullable(),
  min_subtotal: integerField("Min belanja", 0),
  quota: integerField("Kuota", 1).nullable(),
  per_user_limit: integerField("Batas per pembeli", 1),
  starts_at: dateTimeField("Waktu mulai wajib diisi."),
  ends_at: dateTimeField("Waktu selesai wajib diisi."),
  is_active: z.boolean(),
  is_public: z.boolean().default(true),
});

/**
 * Memeriksa form promo, termasuk aturan antar-field (nilai sesuai jenis, kuota tidak di bawah yang terpakai, waktu selesai setelah mulai).
 * @param value isian
 * @param usedCount jumlah voucher yang sudah terpakai (untuk promo yang diubah)
 * @returns pesan per field; objek kosong bila valid
 */
export function validatePromo(value: unknown, usedCount = 0): Record<string, string> {
  // 1. Periksa tiap field dengan schema.
  const errors = validateFields(promoFormSchema, value);
  const input = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  // 2. Nilai potongan minimal 1; persen paling banyak 100.
  if (input.type !== "free_service_fee" && !errors.value && typeof input.value === "number") {
    if (input.value < 1) errors.value = "Nilai minimal 1.";
    else if (input.type === "percent" && input.value > 100) errors.value = "Persen maksimal 100.";
  }
  // 3. Kuota tidak boleh di bawah yang sudah terpakai, dan waktu selesai harus setelah mulai.
  if (typeof input.quota === "number" && !errors.quota && input.quota < usedCount)
    errors.quota = `Kuota tidak boleh di bawah yang sudah terpakai (${usedCount}).`;
  if (!errors.starts_at && !errors.ends_at && Date.parse(String(input.ends_at)) <= Date.parse(String(input.starts_at)))
    errors.ends_at = "Waktu selesai harus setelah waktu mulai.";
  return errors;
}

/**
 * Mengambil hanya field promo yang boleh diubah: kode jadi huruf kapital, nilai dan maks potongan disesuaikan jenis promo.
 * Panggil setelah `validatePromo` kosong.
 * @param value isian
 * @returns field promo yang sudah dirapikan, siap dikirim ke backend
 * @throws galat zod bila isian tidak valid
 */
export function parsePromo(value: unknown) {
  const promo = promoFormSchema.parse(value);
  return {
    ...promo,
    description: promo.description || null,
    value: promo.type === "free_service_fee" ? 0 : promo.value,
    max_discount: promo.type === "percent" ? promo.max_discount : null,
  };
}
