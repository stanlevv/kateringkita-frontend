"use server";

import { apiFetch, hasil, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/authService";
import type { ActionResult } from "@/types/api";
import type { Meja, PesananMeja } from "@/types/meja";
import type { MerchantProfile } from "@/types/profile";

// F21 pesan dari meja. Validasi isi ada di backend; aksi ini hanya meneruskan.

// ---- penjual ----
export async function setDineIn(aktif: boolean): Promise<ActionResult<MerchantProfile>> {
  await requireMerchant();
  return hasil(await merchantFetch<MerchantProfile>("/profile", { method: "PATCH", body: JSON.stringify({ dine_in_enabled: aktif }) }));
}

export async function tambahMeja(label: string): Promise<ActionResult<Meja>> {
  await requireMerchant();
  return hasil(await merchantFetch<Meja>("/tables", { method: "POST", body: JSON.stringify({ label }) }));
}

export async function ubahMeja(id: number, input: { label?: string; is_active?: boolean; ganti_token?: true }): Promise<ActionResult<Meja>> {
  await requireMerchant();
  return hasil(await merchantFetch<Meja>(`/tables/${id}`, { method: "PATCH", body: JSON.stringify(input) }));
}

// ---- tamu (tanpa login) ----
const tamu = (token: string) => ({ "X-Guest-Token": token });

export async function pesanDariMeja(token: string, input: unknown): Promise<ActionResult<PesananMeja & { guest_token: string }>> {
  return hasil(await apiFetch(`/tables/${encodeURIComponent(token)}/orders`, { method: "POST", body: JSON.stringify(input) }));
}

export async function statusPesananMeja(code: string, token: string): Promise<ActionResult<PesananMeja>> {
  return hasil(await apiFetch(`/guest/orders/${encodeURIComponent(code)}`, { headers: tamu(token) }));
}

export async function bayarPesananMeja(code: string, token: string, kembali: string): Promise<ActionResult<{ payment_url: string }>> {
  return hasil(await apiFetch(`/guest/orders/${encodeURIComponent(code)}/pay`, {
    method: "POST", headers: tamu(token), body: JSON.stringify({ kembali }),
  }));
}
