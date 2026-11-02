import type { ActionResult } from "./types";

/** Server action bisa melempar (jaringan putus, server dimulai ulang); ubah jadi galat agar UI tidak macet. */
export async function panggil<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch {
    return { error: { code: "NETWORK", message: "Server tidak dapat dihubungi. Coba lagi." } };
  }
}
