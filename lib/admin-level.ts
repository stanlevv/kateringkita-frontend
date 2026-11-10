// Fase 1: tingkat admin. Cermin backend middleware/admin-akses.ts (backend tetap penjaga utamanya).
export type AdminLevel = "super" | "ops" | "support";

export const LABEL_LEVEL: Record<AdminLevel, string> = { super: "Super", ops: "Operasional", support: "Support" };
export const KETERANGAN_LEVEL: Record<AdminLevel, string> = {
  super: "Semua fitur, termasuk kelola admin, keuangan, AI, dan server.",
  ops: "Verifikasi, penjual, moderasi, data master, promo, pengumuman. Tanpa keuangan, AI, server, dan kelola admin.",
  support: "Hanya melihat data, tanpa mengubah apa pun.",
};

// Halaman panel yang hanya untuk super
const KHUSUS_SUPER = ["/admin/admin", "/admin/keuangan", "/admin/pencairan", "/admin/ai", "/admin/server"];

export const halamanBoleh = (level: unknown, href: string) =>
  level === "super" || !KHUSUS_SUPER.some((h) => href === h || href.startsWith(`${h}/`));
