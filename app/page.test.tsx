// Test halaman /: tombol utama sesuai peran, header pengunjung saat backend mati, tanpa klaim palsu, dan JSON-LD.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Home from "./page";

let backendDown = false;
const getSession = vi.fn();
vi.mock("@/services/auth.service", () => ({
  getSession: () => (backendDown ? Promise.reject(new Error("down")) : getSession()),
}));

// jsdom tidak punya IntersectionObserver/matchMedia; animasi landing cukup dibuat diam.
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    disconnect() {}
  },
);
vi.stubGlobal("matchMedia", () => ({ matches: true }));

beforeEach(() => {
  getSession.mockReset();
  backendDown = false;
});

describe("landing", () => {
  it("pengunjung: Masuk + Daftar sebagai penjual", async () => {
    getSession.mockResolvedValue(null);
    render(await Home());
    expect(screen.getAllByRole("link", { name: "Masuk" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: /Daftar/ })[0]).toHaveAttribute("href", "/register");
  });

  it("sudah login: Buka dashboard", async () => {
    getSession.mockResolvedValue({ user: { role: "merchant" }, merchant: {} });
    render(await Home());
    expect(screen.getAllByRole("link", { name: "Buka dashboard" })[0]).toHaveAttribute("href", "/dashboard");
  });

  it("admin: tombol Ke panel admin -> /admin", async () => {
    getSession.mockResolvedValue({ user: { role: "admin" }, merchant: null });
    render(await Home());
    expect(screen.getAllByRole("link", { name: "Ke panel admin" })[0]).toHaveAttribute("href", "/admin");
    expect(screen.queryByRole("link", { name: "Buka dashboard" })).toBeNull();
  });

  it("backend mati -> header pengunjung", async () => {
    backendDown = true;
    render(await Home());
    expect(screen.getAllByRole("link", { name: "Masuk" }).length).toBeGreaterThan(0);
  });

  it("tanpa klaim palsu", async () => {
    getSession.mockResolvedValue(null);
    const { container } = render(await Home());
    expect(container.textContent).not.toMatch(/Redis|RAG|Lab|WebSocket/);
    expect(container.textContent).not.toMatch(/gratis/i);
    // tiga ketukan alur pesanan
    expect(within(container.querySelector<HTMLElement>("#alur")!).getAllByRole("heading", { level: 3 })).toHaveLength(
      3,
    );
  });

  it("SEO: satu h1, JSON-LD FAQPage sama dengan tanya jawab yang tampil", async () => {
    getSession.mockResolvedValue(null);
    const { container } = render(await Home());
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const jsonLd = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    const faq = jsonLd["@graph"].find((node: { "@type": string }) => node["@type"] === "FAQPage");
    const shownQuestions = [...container.querySelectorAll("#faq summary")].map((summary) => summary.textContent);
    expect(shownQuestions.length).toBeGreaterThan(0);
    expect(faq.mainEntity.map((question: { name: string }) => question.name)).toEqual(shownQuestions);
  });

  it("sinyal lokal UB Malang: label hero, footer, areaServed Organization", async () => {
    getSession.mockResolvedValue(null);
    const { container } = render(await Home());
    expect(screen.getByText("Untuk penjual katering di sekitar kampus UB Malang")).toBeInTheDocument();
    expect(container.textContent).toContain("untuk dapur di sekitar Universitas Brawijaya, Malang.");
    const jsonLd = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    const org = jsonLd["@graph"].find((n: { "@type": string }) => n["@type"] === "Organization");
    expect(org.areaServed).toEqual([
      { "@type": "City", name: "Malang" },
      { "@type": "CollegeOrUniversity", name: "Universitas Brawijaya" },
    ]);
  });

  it("footer menautkan ke daftar katering /toko", async () => {
    getSession.mockResolvedValue(null);
    render(await Home());
    expect(screen.getByRole("link", { name: "Lihat katering yang sudah bergabung" })).toHaveAttribute("href", "/toko");
  });
});
