import { describe, expect, it, vi } from "vitest";

const redirect = (to: string): never => { throw new Error(`REDIRECT ${to}`); };
const notFound = (): never => { throw new Error("NOT_FOUND"); };
let me: { status: number; ok: boolean; data?: unknown } = { status: 401, ok: false };
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to), notFound: () => notFound() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "t" }) }) }));
vi.mock("@/lib/api", () => ({ apiFetch: async () => me }));

const sesi = (role: string) => { me = { status: 200, ok: true, data: { user: { role }, merchant: null } }; };

describe("G-10 requireMerchant", () => {
  it("sesi habis -> alasan=sesi-habis", async () => {
    me = { status: 401, ok: false };
    const { requireMerchant } = await import("./session");
    await expect(requireMerchant()).rejects.toThrow("REDIRECT /login?alasan=sesi-habis");
  });
  it("bukan penjual -> alasan=bukan-penjual", async () => {
    sesi("customer");
    const { requireMerchant } = await import("./session");
    await expect(requireMerchant()).rejects.toThrow("REDIRECT /login?alasan=bukan-penjual");
  });
  it("admin -> /admin", async () => {
    sesi("admin");
    const { requireMerchant } = await import("./session");
    await expect(requireMerchant()).rejects.toThrow("REDIRECT /admin");
  });
  it("penjual -> sesi", async () => {
    sesi("merchant");
    const { requireMerchant } = await import("./session");
    await expect(requireMerchant()).resolves.toMatchObject({ user: { role: "merchant" } });
  });
});

describe("F18 requireAdmin", () => {
  it("sesi habis -> alasan=sesi-habis", async () => {
    me = { status: 401, ok: false };
    const { requireAdmin } = await import("./session");
    await expect(requireAdmin()).rejects.toThrow("REDIRECT /login?alasan=sesi-habis");
  });
  it.each(["merchant", "customer"])("%s -> notFound", async (role) => {
    sesi(role);
    const { requireAdmin } = await import("./session");
    await expect(requireAdmin()).rejects.toThrow("NOT_FOUND");
  });
  it("admin -> sesi", async () => {
    sesi("admin");
    const { requireAdmin } = await import("./session");
    await expect(requireAdmin()).resolves.toMatchObject({ user: { role: "admin" } });
  });
});
