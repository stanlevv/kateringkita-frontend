// Tingkat admin (super, ops, support) dan halaman panel yang boleh dibuka tiap tingkat.
// Ini hanya untuk tampilan (menyembunyikan menu); backend tetap memeriksa hak akses di setiap permintaan.

/** Tingkat admin. `super` boleh semua, `ops` mengurus operasional, `support` hanya tiket bantuan. */
export type AdminLevel = "super" | "ops" | "support";

/** Nama tiap tingkat admin untuk ditampilkan. */
export const LEVEL_LABELS: Record<AdminLevel, string> = { super: "Super", ops: "Operasional", support: "Support" };
/** Penjelasan singkat hak tiap tingkat admin, ditampilkan di halaman kelola admin. */
export const LEVEL_DESCRIPTIONS: Record<AdminLevel, string> = {
  super: "Semua fitur, termasuk kelola admin, keuangan, AI, dan server.",
  ops: "Verifikasi, penjual, moderasi, tiket bantuan, data master, promo, pengumuman. Tanpa keuangan, AI, server, dan kelola admin.",
  // Backend: support boleh GET di luar fitur khusus super, plus GET/POST /tickets…
  support: "Melihat data serta membalas dan menutup tiket bantuan. Selain tiket, tidak bisa mengubah apa pun.",
};

// Halaman panel yang hanya untuk super
const SUPER_ONLY_PAGES = ["/admin/admin", "/admin/keuangan", "/admin/pencairan", "/admin/ai", "/admin/server"];

/**
 * Mengecek apakah admin dengan tingkat tertentu boleh membuka halaman panel.
 * @param level tingkat admin yang login (bisa kosong bila data sesi tidak lengkap)
 * @param href alamat halaman, mis. "/admin/keuangan"
 * @returns true bila boleh; halaman khusus super hanya boleh untuk tingkat super
 */
export const canAccessPage = (level: unknown, href: string) =>
  level === "super" || !SUPER_ONLY_PAGES.some((page) => href === page || href.startsWith(`${page}/`));
