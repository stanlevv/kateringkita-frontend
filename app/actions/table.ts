"use server";

import { apiFetch, toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Table, TableOrder } from "@/types/table";
import type { MerchantProfile } from "@/types/profile";

// F21 pesan dari meja. Validasi isi ada di backend; aksi ini hanya meneruskan.

// ---- penjual ----
export async function setDineIn(enabled: boolean): Promise<ActionResult<MerchantProfile>> {
  await requireMerchant();
  return toResult(
    await merchantFetch<MerchantProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify({ dine_in_enabled: enabled }),
    }),
  );
}

export async function createTable(label: string): Promise<ActionResult<Table>> {
  await requireMerchant();
  return toResult(await merchantFetch<Table>("/tables", { method: "POST", body: JSON.stringify({ label }) }));
}

export async function updateTable(
  id: number,
  input: { label?: string; is_active?: boolean; ganti_token?: true },
): Promise<ActionResult<Table>> {
  await requireMerchant();
  return toResult(await merchantFetch<Table>(`/tables/${id}`, { method: "PATCH", body: JSON.stringify(input) }));
}

// ---- tamu (tanpa login) ----
const guestHeaders = (token: string) => ({ "X-Guest-Token": token });

export async function createTableOrder(
  token: string,
  input: unknown,
): Promise<ActionResult<TableOrder & { guest_token: string }>> {
  return toResult(
    await apiFetch(`/tables/${encodeURIComponent(token)}/orders`, { method: "POST", body: JSON.stringify(input) }),
  );
}

export async function getTableOrderStatus(code: string, token: string): Promise<ActionResult<TableOrder>> {
  return toResult(await apiFetch(`/guest/orders/${encodeURIComponent(code)}`, { headers: guestHeaders(token) }));
}

export async function payTableOrder(
  code: string,
  token: string,
  returnUrl: string,
): Promise<ActionResult<{ payment_url: string }>> {
  return toResult(
    await apiFetch(`/guest/orders/${encodeURIComponent(code)}/pay`, {
      method: "POST",
      headers: guestHeaders(token),
      body: JSON.stringify({ kembali: returnUrl }),
    }),
  );
}
