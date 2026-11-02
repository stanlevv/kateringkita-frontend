// Data penjual dari backend ditiru dengan fixture.
vi.mock("@/lib/merchant-api", async () => ({
  merchantFetch: async (path: string) => ({ ok: true, status: 200, data: path.startsWith("/orders") ? (await import("@/lib/fixtures/orders")).orders() : (await import("@/lib/fixtures/profile")).profile(), meta: { total: 16 } }),
}));
vi.mock("@/lib/api", async (orig) => ({ ...(await orig<typeof import("@/lib/api")>()), apiFetch: async () => ({ ok: true, status: 200, data: (await import("@/lib/fixtures/meta")).pickupPoints() }) }));
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getSkenario = vi.fn();
const requireMerchant = vi.fn(async () => ({ user: { full_name: "Diego", phone: "081234567890", email: "d@x.id" }, merchant: null }));
vi.mock("@/lib/skenario", () => ({ getSkenario: () => getSkenario() }));
vi.mock("@/lib/session", () => ({ requireMerchant: () => requireMerchant() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/actions/profile", () => ({ saveProfile: vi.fn() }));
vi.mock("@/app/actions/account", () => ({ changePassword: vi.fn() }));
import PengaturanPage from "./page";
import TemplateWAPage from "../template-wa/page";

const q = (o: Record<string, string> = {}) => Promise.resolve(o);
afterEach(() => { getSkenario.mockReset(); requireMerchant.mockClear(); });

describe("halaman /pengaturan (M-10)", () => {
  it("memanggil requireMerchant; satu h1; semua bagian ada", async () => {
    getSkenario.mockResolvedValue(null);
    render(await PengaturanPage({ searchParams: q() }));
    expect(requireMerchant).toHaveBeenCalled();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const id of ["profil", "operasional", "titik-temu", "pembayaran", "akun"]) expect(document.getElementById(id)).toBeInTheDocument();
  });
  it("gagal-muat -> pesan dan Coba lagi, tanpa form", async () => {
    getSkenario.mockResolvedValue("gagal-muat");
    render(await PengaturanPage({ searchParams: q() }));
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
    expect(document.getElementById("profil")).not.toBeInTheDocument();
  });
});

describe("halaman /template-wa (M-11)", () => {
  it("memanggil requireMerchant; satu h1; pratinjau dari pesanan pertama", async () => {
    getSkenario.mockResolvedValue(null);
    render(await TemplateWAPage());
    expect(requireMerchant).toHaveBeenCalled();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Pratinjau pesan" })).toHaveTextContent("Rafli Ramadhan");
  });
  it("gagal-muat -> Coba lagi", async () => {
    getSkenario.mockResolvedValue("gagal-muat");
    render(await TemplateWAPage());
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });
});
