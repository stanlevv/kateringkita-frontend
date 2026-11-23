import "server-only";
import { apiFetch, hasil, merchantFetch } from "@/services/api";
import type { Meja, MenuMeja } from "@/types/meja";

// F21: daftar meja toko (penjual) dan menu meja (publik, tanpa sesi)
export const getTables = async () => hasil(await merchantFetch<Meja[]>("/tables"));

export const getMenuMeja = (token: string) => apiFetch<MenuMeja>(`/tables/${encodeURIComponent(token)}`);
