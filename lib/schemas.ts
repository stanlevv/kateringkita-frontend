import { z } from "zod";
import { formatRupiah } from "./format";
import { cekTemplate } from "./wa-template";

// --- Auth (M-01, M-02): aturan sama dengan be/src/auth/schemas.ts ---
const wajib = (pesan: string, maks: number) => z.string().trim().min(1, pesan).max(maks, `Maksimal ${maks} karakter.`);

export const loginSchema = z.object({
  identifier: wajib("Email atau nomor WA wajib diisi.", 255),
  password: z.string().min(1, "Kata sandi wajib diisi.").max(72, "Kata sandi maksimal 72 karakter."),
});

const nomorWa = z.string().regex(/^08\d{8,11}$/, "Nomor WA harus diawali 08 dan 10–13 digit.");

export const kataSandiBaru = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(72, "Kata sandi maksimal 72 karakter.")
  .regex(/[A-Za-z]/, "Kata sandi harus mengandung huruf.")
  .regex(/\d/, "Kata sandi harus mengandung angka.");

export const ownerSchema = z
  .object({
    full_name: wajib("Nama lengkap wajib diisi.", 150),
    phone: nomorWa,
    email: z.string().trim().refine((v) => v === "" || z.email().safeParse(v).success, "Format email tidak valid."),
    password: kataSandiBaru,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Konfirmasi kata sandi tidak sama." });

export const businessSchema = z.object({
  business_name: wajib("Nama usaha wajib diisi.", 150),
  merchant_type_id: z.string().min(1, "Jenis usaha wajib dipilih."),
  address: wajib("Alamat wajib diisi.", 255),
});

// --- Menu (M-07): aturan sama dengan API.md POST /merchant/menus ---
const angka = (label: string, min: number, maks?: number) => {
  const a = z.number({ error: `${label} wajib diisi.` }).int(`${label} harus bilangan bulat.`).min(min, `${label} minimal ${min.toLocaleString("id-ID")}.`);
  return maks === undefined ? a : a.max(maks, `${label} maksimal ${maks.toLocaleString("id-ID")}.`);
};

const menuFormObject = z.object({
  name: wajib("Nama menu wajib diisi.", 80),
  category_id: z.number({ error: "Kategori wajib dipilih." }).int().min(1, "Kategori wajib dipilih."),
  description: z.string().trim().max(500, "Maksimal 500 karakter."),
  image_url: z.string().nullable(),
  unit_label: wajib("Satuan wajib diisi.", 30),
  price: angka("Harga jual", 1000, 100_000_000),
  hpp: angka("HPP", 0, 100_000_000),
  daily_quota: angka("Kuota harian", 0, 10_000),
  prep_minutes: angka("Estimasi siap", 1, 1440),
  is_preorder: z.boolean(),
  preorder_days: z.number({ error: "Hari pre-order wajib diisi." }).int("Hari pre-order harus bilangan bulat."),
  min_order_qty: angka("Minimum pesan", 1, 1000),
  options: z.array(z.object({ name: wajib("Nama opsi wajib diisi.", 60), extra_price: angka("Tambahan harga", 0, 1_000_000) })).max(20, "Maksimal 20 opsi."),
});

export const menuFormSchema = menuFormObject.check(lintasField());

// Aturan antar-field harus tetap jalan walau field lain salah tipe (mis. kategori belum dipilih),
// jadi `when` dipaksa true dan data dibaca defensif.
function lintasField() {
  const c = z.superRefine((d: z.infer<typeof menuFormObject>, ctx) => {
    if (typeof d !== "object" || d === null) return; // input server action bisa apa saja; galat tipe sudah dilaporkan
    if (Number.isFinite(d.price) && Number.isFinite(d.hpp) && d.price <= d.hpp) ctx.addIssue({ code: "custom", path: ["price"], message: `Harga jual harus lebih besar dari HPP (${formatRupiah(d.hpp)}).` });
    if (d.is_preorder && !(d.preorder_days >= 1 && d.preorder_days <= 7)) ctx.addIssue({ code: "custom", path: ["preorder_days"], message: "Hari pre-order harus 1 sampai 7." });
    const lihat = new Set<string>();
    (Array.isArray(d.options) ? d.options : []).forEach((o, i) => {
      const k = typeof o?.name === "string" ? o.name.trim().toLowerCase() : "";
      if (k && lihat.has(k)) ctx.addIssue({ code: "custom", path: ["options", i, "name"], message: "Nama opsi sama dengan opsi lain." });
      lihat.add(k);
    });
  });
  c._zod.def.when = () => true;
  return c;
}

/** Pesan pertama per field (jalur bertitik, mis. options.1.name); objek kosong bila valid. */
export function cekField(schema: z.ZodType, nilai: unknown): Record<string, string> {
  const r = schema.safeParse(nilai);
  const out: Record<string, string> = {};
  if (!r.success) for (const i of r.error.issues) out[i.path.join(".")] ??= i.message;
  return out;
}

// --- Pengaturan toko (M-10, M-11): aturan sama dengan API.md PATCH /merchant/profile ---
const jam = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam harus berformat JJ:MM.");
const profilForm = {
  business_name: wajib("Nama usaha wajib diisi.", 150),
  description: z.string().trim().max(500, "Maksimal 500 karakter."),
  logo_url: z.string().nullable(),
  address: wajib("Alamat wajib diisi.", 255),
  wa_number: nomorWa,
  service_mode: z.enum(["daily", "event", "both"], { error: "Pilih mode layanan." }),
  open_time: jam,
  close_time: jam,
  hold_minutes: angka("Durasi tahan pesanan", 1, 30),
  daily_revenue_target: angka("Target omzet", 0, 1_000_000_000),
  qris_image_url: z.string().nullable(),
  pickup_point_ids: z.array(z.number().int()).min(1, "Pilih minimal satu titik temu."),
};
const profilPenuh = z.object(profilForm);
const profilSebagian = z.object({
  ...profilForm,
  wa_template: z.string().superRefine((t, ctx) => {
    const e = cekTemplate(t);
    if (e) ctx.addIssue({ code: "custom", message: e });
  }),
}).partial();

/** Satu pintu validasi untuk form (penuh) dan server action (penuh atau sebagian, mis. hanya wa_template). */
export function cekProfil(nilai: unknown, penuh = true): Record<string, string> {
  const out = cekField(penuh ? profilPenuh : profilSebagian, nilai);
  // Aturan antar-jam dicek terpisah agar tetap muncul walau field lain salah.
  const d = nilai as { open_time?: unknown; close_time?: unknown } | null;
  if (typeof d?.open_time === "string" && typeof d.close_time === "string" && !out.close_time && !out.open_time && d.close_time <= d.open_time) {
    out.close_time = "Jam tutup harus setelah jam buka.";
  }
  return out;
}

/** Hasil parse: hanya field yang boleh diubah, sudah dirapikan (trim). Panggil setelah cekProfil kosong. */
export function bersihkanProfil(nilai: unknown, penuh = true) {
  return (penuh ? profilPenuh : profilSebagian).parse(nilai);
}

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Kata sandi lama wajib diisi.").max(72, "Kata sandi maksimal 72 karakter."),
    new_password: kataSandiBaru,
  })
  .refine((d) => d.current_password !== d.new_password, { path: ["new_password"], message: "Kata sandi baru harus berbeda dari kata sandi lama." });

// --- Promo (M-13): aturan sama dengan API.md POST/PATCH /merchant/promos ---
const waktu = (pesan: string) => z.string({ error: pesan }).refine((s) => s !== "" && !Number.isNaN(Date.parse(s)), pesan);
const promoForm = z.object({
  code: z.string({ error: "Kode wajib diisi." }).trim().toUpperCase().regex(/^[A-Z0-9]{3,30}$/, "Kode 3–30 huruf besar atau angka."),
  description: z.string().trim().max(255, "Maksimal 255 karakter."),
  type: z.enum(["percent", "fixed", "free_service_fee"], { error: "Pilih jenis promo." }),
  value: z.number({ error: "Nilai wajib diisi." }).int("Nilai harus bilangan bulat."),
  max_discount: angka("Maks potongan", 1).nullable(),
  min_subtotal: angka("Min belanja", 0),
  quota: angka("Kuota", 1).nullable(),
  per_user_limit: angka("Batas per pembeli", 1),
  starts_at: waktu("Waktu mulai wajib diisi."),
  ends_at: waktu("Waktu selesai wajib diisi."),
  is_active: z.boolean(),
});

/** Satu pintu validasi promo untuk form dan server action. `terpakai` = used_count promo yang diubah. */
export function cekPromo(nilai: unknown, terpakai = 0): Record<string, string> {
  const out = cekField(promoForm, nilai);
  const d = (typeof nilai === "object" && nilai !== null ? nilai : {}) as Record<string, unknown>;
  if (d.type !== "free_service_fee" && !out.value && typeof d.value === "number") {
    if (d.value < 1) out.value = "Nilai minimal 1.";
    else if (d.type === "percent" && d.value > 100) out.value = "Persen maksimal 100.";
  }
  if (typeof d.quota === "number" && !out.quota && d.quota < terpakai) out.quota = `Kuota tidak boleh di bawah yang sudah terpakai (${terpakai}).`;
  if (!out.starts_at && !out.ends_at && Date.parse(String(d.ends_at)) <= Date.parse(String(d.starts_at))) out.ends_at = "Waktu selesai harus setelah waktu mulai.";
  return out;
}

/** Hasil parse: hanya field promo yang boleh diubah, dirapikan (kode kapital; nilai/maks potongan sesuai jenis). Panggil setelah cekPromo kosong. */
export function bersihkanPromo(nilai: unknown) {
  const p = promoForm.parse(nilai);
  return {
    ...p,
    description: p.description || null,
    value: p.type === "free_service_fee" ? 0 : p.value,
    max_discount: p.type === "percent" ? p.max_discount : null,
  };
}
