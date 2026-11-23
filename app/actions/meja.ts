"use server";

import { apiFetch, toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Table, TableOrder } from "@/types/table";
import type { MerchantProfile } from "@/types/profile";

// F21 pesan dari meja. Validasi isi ada di backend; aksi ini hanya meneruskan.

// ---- penjual ----
export async function setDineIn(aktif: boolean): Promise<ActionResult<MerchantProfile>> {
  await requireMerchant();
  return toResult(
    await merchantFetch<MerchantProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify({ dine_in_enabled: aktif }),
    }),
  );
}

export async function tambahMeja(label: string): Promise<ActionResult<Table>> {
  await requireMerchant();
  return toResult(await merchantFetch<Table>("/tables", { method: "POST", body: JSON.stringify({ label }) }));
}

export async function ubahMeja(
  id: number,
  input: { label?: string; is_active?: boolean; ganti_token?: true },
): Promise<ActionResult<Table>> {
  await requireMerchant();
  return toResult(await merchantFetch<Table>(`/tables/${id}`, { method: "PATCH", body: JSON.stringify(input) }));
}

// ---- tamu (tanpa login) ----
const tamu = (token: string) => ({ "X-Guest-Token": token });

export async function pesanDariMeja(
  token: string,
  input: unknown,
): Promise<ActionResult<TableOrder & { guest_token: string }>> {
  return toResult(
    await apiFetch(`/tables/${encodeURIComponent(token)}/orders`, { method: "POST", body: JSON.stringify(input) }),
  );
}

export async function statusPesananMeja(code: string, token: string): Promise<ActionResult<TableOrder>> {
  return toResult(await apiFetch(`/guest/orders/${encodeURIComponent(code)}`, { headers: tamu(token) }));
}

export async function bayarPesananMeja(
  code: string,
  token: string,
  kembali: string,
): Promise<ActionResult<{ payment_url: string }>> {
  return toResult(
    await apiFetch(`/guest/orders/${encodeURIComponent(code)}/pay`, {
      method: "POST",
      headers: tamu(token),
      body: JSON.stringify({ kembali }),
    }),
  );
}
