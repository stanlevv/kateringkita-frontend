import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./login/page";
import RegisterPage from "./register/page";

let backendDown = false;
const getSession = vi.fn();
const redirect = vi.fn((target: string) => {
  throw new Error(`REDIRECT ${target}`);
});
vi.mock("@/services/auth.service", () => ({
  getSession: () => (backendDown ? Promise.reject(new Error("down")) : getSession()),
}));
vi.mock("next/navigation", () => ({ redirect: (target: string) => redirect(target) }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/services/api", () => ({ apiFetch: async () => ({ ok: true, status: 200, data: [] }) }));

beforeEach(() => {
  getSession.mockReset();
  redirect.mockClear();
  backendDown = false;
});
const buildSearchParams = (values = {}) => Promise.resolve(values);
const merchant = { user: { role: "merchant" }, merchant: {} };

describe("LG-A3 / RG-A2 sudah login", () => {
  it("/login -> /dashboard", async () => {
    getSession.mockResolvedValue(merchant);
    await expect(LoginPage({ searchParams: buildSearchParams() })).rejects.toThrow("REDIRECT /dashboard");
  });
  it("/register -> /dashboard", async () => {
    getSession.mockResolvedValue(merchant);
    await expect(RegisterPage()).rejects.toThrow("REDIRECT /dashboard");
  });
  it("/login admin -> /admin", async () => {
    getSession.mockResolvedValue({ user: { role: "admin" }, merchant: null });
    await expect(LoginPage({ searchParams: buildSearchParams() })).rejects.toThrow("REDIRECT /admin");
  });
  it("/register admin -> /admin", async () => {
    getSession.mockResolvedValue({ user: { role: "admin" }, merchant: null });
    await expect(RegisterPage()).rejects.toThrow("REDIRECT /admin");
  });
  it("backend mati -> form tetap tampil", async () => {
    backendDown = true;
    await expect(LoginPage({ searchParams: buildSearchParams() })).resolves.toBeTruthy();
    await expect(RegisterPage()).resolves.toBeTruthy();
  });
  it("bukan penjual -> form tampil", async () => {
    getSession.mockResolvedValue({ user: { role: "customer" }, merchant: null });
    await expect(LoginPage({ searchParams: buildSearchParams({ alasan: "bukan-penjual" }) })).resolves.toBeTruthy();
  });
});
