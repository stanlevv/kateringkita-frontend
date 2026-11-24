// Test service hitungan antrean admin: path backend, data diteruskan, dan galat apa pun menjadi null.
// adminFetch dipalsukan (vi.mock), jadi test berjalan tanpa backend.
import { afterEach, describe, expect, it, vi } from "vitest";

const adminFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
import { getAdminQueues } from "./admin-queue.service";

const QUEUES = {
  merchants_pending: 1,
  tickets_open: 2,
  chats_reported: 3,
  payouts_pending: null,
  refunds_pending: null,
  ai_results_pending: 4,
};

afterEach(() => adminFetch.mockReset());

describe("getAdminQueues", () => {
  it("GET /queues dan mengembalikan data", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: QUEUES });
    expect(await getAdminQueues()).toEqual(QUEUES);
    expect(adminFetch).toHaveBeenCalledWith("/queues");
  });
  it("galat backend (500, 403) menjadi null", async () => {
    adminFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "INTERNAL_ERROR", message: "x" } });
    expect(await getAdminQueues()).toBeNull();
    adminFetch.mockResolvedValue({ ok: false, status: 403, error: { code: "FORBIDDEN", message: "x" } });
    expect(await getAdminQueues()).toBeNull();
  });
});
