import { describe, expect, it, vi } from "vitest";

const redirect = (to: string): never => {
  throw new Error(`REDIRECT ${to}`);
};
const notFound = (): never => {
  throw new Error("NOT_FOUND");
};
let me: { status: number; ok: boolean; data?: unknown } = { status: 401, ok: false };
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to), notFound: () => notFound() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "t" }) }) }));
vi.mock("@/services/api", () => ({ apiFetch: async () => me }));

const asRole = (role: string) => {
  me = { status: 200, ok: true, data: { user: { role }, merchant: null } };
};

describe("G-10 requireMerchant", () => {
  it("sesi habis -> alasan=sesi-habis", async () => {
    me = { status: 401, ok: false };
    const { requireMerchant } = await import("./auth.service");
    await expect(requireMerchant()).rejects.toThrow("REDIRECT /login?alasan=sesi-habis");
  });
  it("bukan penjual -> alasan=bukan-penjual", async () => {
    asRole("customer");
    const { requireMerchant } = await import("./auth.service");
    await expect(requireMerchant()).rejects.toThrow("REDIRECT /login?alasan=bukan-penjual");
  });
  it("admin -> /admin", async () => {
    asRole("admin");
    const { requireMerchant } = await import("./auth.service");
    await expect(requireMerchant()).rejects.toThrow("REDIRECT /admin");
  });
  it("penjual -> sesi", async () => {
    asRole("merchant");
    const { requireMerchant } = await import("./auth.service");
    await expect(requireMerchant()).resolves.toMatchObject({ user: { role: "merchant" } });
  });
});

describe("F18 requireAdmin", () => {
  it("sesi habis -> alasan=sesi-habis", async () => {
    me = { status: 401, ok: false };
    const { requireAdmin } = await import("./auth.service");
    await expect(requireAdmin()).rejects.toThrow("REDIRECT /login?alasan=sesi-habis");
  });
  it.each(["merchant", "customer"])("%s -> notFound", async (role) => {
    asRole(role);
    const { requireAdmin } = await import("./auth.service");
    await expect(requireAdmin()).rejects.toThrow("NOT_FOUND");
  });
  it("admin -> sesi", async () => {
    asRole("admin");
    const { requireAdmin } = await import("./auth.service");
    await expect(requireAdmin()).resolves.toMatchObject({ user: { role: "admin" } });
  });
});
