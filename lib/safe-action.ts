import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import { cookies } from "next/headers";

export class ActionError extends Error {}

// 1. Base action client
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof ActionError) {
      return e.message;
    }
    console.error("Server Action Error:", e);
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defaultValidationErrorsShape: "flattened",
});

// 2. Wrapper next-safe-action: Memaksa autentikasi di setiap mutasi
export const authActionClient = actionClient.use(async ({ next }) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

  if (!token) {
    throw new ActionError("Pengguna yang belum login ditolak oleh action. Silakan login terlebih dahulu.");
  }

  return next({
    ctx: {
      token,
      user: { id: "merchant-1", role: "merchant" },
    },
  });
});
