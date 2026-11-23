import "server-only";
import { apiFetch, toResult, merchantFetch } from "@/services/api";
import type { Table, TableMenu } from "@/types/table";

// F21: daftar meja toko (penjual) dan menu meja (publik, tanpa sesi)
export const getTables = async () => toResult(await merchantFetch<Table[]>("/tables"));

export const getTableMenu = (token: string) => apiFetch<TableMenu>(`/tables/${encodeURIComponent(token)}`);
