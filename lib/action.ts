import type { ActionResult } from "@/types/api";

/** Server action bisa melempar (jaringan putus, server dimulai ulang); ubah jadi galat agar UI tidak macet. */
export async function callAction<T>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await action();
  } catch {
    return { error: { code: "NETWORK", message: "Server tidak dapat dihubungi. Coba lagi." } };
  }
}
