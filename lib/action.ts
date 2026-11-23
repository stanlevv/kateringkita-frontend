// Pembungkus pemanggilan server action dari komponen di browser.
// Server action = fungsi di app/actions yang dipanggil dari browser tetapi dijalankan di server Next.js.

import type { ActionResult } from "@/types/api";

/**
 * Memanggil server action dan mengubah kegagalan jaringan menjadi galat biasa, supaya tampilan tidak macet.
 * Server action bisa melempar galat bila jaringan putus atau server sedang dimulai ulang.
 * @param action fungsi yang memanggil server action
 * @returns hasil server action, atau `{ error }` berkode "NETWORK" bila server tidak dapat dihubungi
 */
export async function callAction<T>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await action();
  } catch {
    return { error: { code: "NETWORK", message: "Server tidak dapat dihubungi. Coba lagi." } };
  }
}
