// Fase 1: tingkat admin. Cermin backend middleware/admin-akses.ts (backend tetap penjaga utamanya).
export type AdminLevel = "super" | "ops" | "support";

export const LEVEL_LABELS: Record<AdminLevel, string> = { super: "Super", ops: "Operasional", support: "Support" };
export const LEVEL_DESCRIPTIONS: Record<AdminLevel, string> = {
  super: "Semua fitur, termasuk kelola admin, keuangan, AI, dan server.",
  ops: "Verifikasi, penjual, moderasi, tiket bantuan, data master, promo, pengumuman. Tanpa keuangan, AI, server, dan kelola admin.",
  // Backend: support boleh GET di luar fitur khusus super, plus GET/POST /tickets…
  support: "Melihat data serta membalas dan menutup tiket bantuan. Selain tiket, tidak bisa mengubah apa pun.",
};

// Halaman panel yang hanya untuk super
const SUPER_ONLY_PAGES = ["/admin/admin", "/admin/keuangan", "/admin/pencairan", "/admin/ai", "/admin/server"];

export const canAccessPage = (level: unknown, href: string) =>
  level === "super" || !SUPER_ONLY_PAGES.some((page) => href === page || href.startsWith(`${page}/`));
