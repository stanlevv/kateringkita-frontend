import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./login/page";
import RegisterPage from "./register/page";

let down = false;
const getSession = vi.fn();
const redirect = vi.fn((to: string) => { throw new Error(`REDIRECT ${to}`); });
vi.mock("@/lib/session", () => ({ getSession: () => (down ? Promise.reject(new Error("down")) : getSession()) }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/api", () => ({ apiFetch: async () => ({ ok: true, status: 200, data: [] }) }));

beforeEach(() => { getSession.mockReset(); redirect.mockClear(); down = false; });
const sp = (o = {}) => Promise.resolve(o);
const merchant = { user: { role: "merchant" }, merchant: {} };

describe("LG-A3 / RG-A2 sudah login", () => {
  it("/login -> /dashboard", async () => {
    getSession.mockResolvedValue(merchant);
    await expect(LoginPage({ searchParams: sp() })).rejects.toThrow("REDIRECT /dashboard");
  });
  it("/register -> /dashboard", async () => {
    getSession.mockResolvedValue(merchant);
    await expect(RegisterPage()).rejects.toThrow("REDIRECT /dashboard");
  });
  it("/login admin -> /admin", async () => {
    getSession.mockResolvedValue({ user: { role: "admin" }, merchant: null });
    await expect(LoginPage({ searchParams: sp() })).rejects.toThrow("REDIRECT /admin");
  });
  it("/register admin -> /admin", async () => {
    getSession.mockResolvedValue({ user: { role: "admin" }, merchant: null });
    await expect(RegisterPage()).rejects.toThrow("REDIRECT /admin");
  });
  it("backend mati -> form tetap tampil", async () => {
    down = true;
    await expect(LoginPage({ searchParams: sp() })).resolves.toBeTruthy();
    await expect(RegisterPage()).resolves.toBeTruthy();
  });
  it("bukan penjual -> form tampil", async () => {
    getSession.mockResolvedValue({ user: { role: "customer" }, merchant: null });
    await expect(LoginPage({ searchParams: sp({ alasan: "bukan-penjual" }) })).resolves.toBeTruthy();
  });
});
