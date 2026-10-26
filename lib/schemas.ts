import { z } from "zod";

export const CATEGORIES = ["Nasi Box", "Snack", "Minuman", "Paket Custom"] as const;

/**
 * Schema Zod bersama untuk validasi data menu di klien dan server.
 * Satu file lib/schemas.ts untuk menjamin integritas kontrak data.
 */
export const menuSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama menu minimal 3 karakter")
    .max(60, "Nama menu maksimal 60 karakter"),
  cat: z.enum(CATEGORIES, {
    message: "Kategori wajib dipilih: Nasi Box, Snack, Minuman, atau Paket Custom",
  }),
  desc: z.string().max(255, "Deskripsi maksimal 255 karakter").optional().default(""),
  img: z.string().optional().default("/menu/1.png"),
  hpp: z.coerce
    .number()
    .min(500, "Modal HPP minimal Rp 500"),
  price: z.coerce
    .number()
    .min(1000, "Harga jual minimal Rp 1.000"),
  stock: z.coerce
    .number()
    .int("Stok harus berupa bilangan bulat")
    .min(0, "Stok kuota minimal 0 porsi"),
  est: z
    .string()
    .min(1, "Estimasi waktu masak wajib dipilih")
    .default("15 Mnt"),
});

export type MenuInput = z.infer<typeof menuSchema>;

export type MenuActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  data?: any;
};
