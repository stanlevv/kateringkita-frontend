// Test NavList panel admin: menu aktif sesuai URL, kelompok menu sesuai tingkat admin, lencana antrean, dan ikon unik.
// Modul Next.js dan server action dipalsukan (vi.mock) agar test tidak butuh server.
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const currentPath = vi.hoisted(() => ({ path: "/admin/log" }));
vi.mock("next/navigation", () => ({ usePathname: () => currentPath.path }));
import { NavList } from "./NavList";
import { ADMIN_NAV } from "./nav";

/** Tautan menu berdasarkan label (atribut title = label menu). */
const navLink = (label: string) => screen.getAllByRole("link").find((link) => link.getAttribute("title") === label)!;
/** Teks lencana untuk pembaca layar, atau null bila tanpa lencana. */
const badgeText = (label: string) => navLink(label).querySelector(".sr-only")?.textContent ?? null;
const QUEUES = {
  merchants_pending: 2,
  tickets_open: 3,
  chats_reported: 1,
  payouts_pending: 4,
  refunds_pending: 2,
  ai_results_pending: 0,
};

const activeLinks = () =>
  screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page")
    .map((link) => link.textContent);

beforeEach(() => {
  currentPath.path = "/admin/log";
});

describe("NavList admin", () => {
  it("di /admin/log hanya Log yang aktif; Dashboard hanya cocok persis", () => {
    render(<NavList admin />);
    expect(activeLinks()).toEqual(["Log"]);
  });
  it("detail tiket menandai Tiket aktif; tingkat support melihat Tiket", () => {
    currentPath.path = "/admin/tiket/TK-20261113-7QPX";
    render(<NavList admin level="support" />);
    expect(activeLinks()).toEqual(["Tiket"]);
  });
  it("super: 6 kelompok, grup Dashboard tanpa judul, urutan menu sesuai keputusan", () => {
    const { container } = render(<NavList admin level="super" />);
    expect(container.querySelectorAll("nav > div")).toHaveLength(6);
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Pengguna",
      "Layanan",
      "Konten & promo",
      "Keuangan",
      "Sistem",
    ]);
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("title"))).toEqual([
      "Dashboard",
      "Verifikasi",
      "Penjual",
      "Pembeli",
      "Tiket",
      "Chat dilaporkan",
      "Moderasi",
      "Verifikasi AI",
      "Banner",
      "Pop-up",
      "Pengumuman",
      "Promo & biaya",
      "Data master",
      "Keuangan",
      "Pencairan",
      "AI",
      "Kelola admin",
      "Log",
      "Server",
    ]);
  });
  it("ops: kelompok Keuangan hilang seluruhnya; Sistem hanya berisi Log", () => {
    render(<NavList admin level="ops" />);
    expect(screen.queryByRole("heading", { name: "Keuangan" })).toBeNull();
    const system = screen.getByRole("heading", { name: "Sistem" }).parentElement!;
    expect(
      within(system)
        .getAllByRole("link")
        .map((link) => link.getAttribute("title")),
    ).toEqual(["Log"]);
  });
  it("lencana antrean dengan teks pembaca layar; 0 dan menu tanpa antrean tanpa lencana", () => {
    render(<NavList admin level="super" queues={QUEUES} />);
    expect(badgeText("Verifikasi")).toBe("2 penjual menunggu verifikasi");
    expect(badgeText("Tiket")).toBe("3 tiket menunggu balasan");
    expect(badgeText("Chat dilaporkan")).toBe("1 laporan chat belum dibuka");
    expect(badgeText("Pencairan")).toBe("6 pencairan dan refund menunggu");
    expect(badgeText("Verifikasi AI")).toBeNull();
    expect(badgeText("Moderasi")).toBeNull();
  });
  it("angka di atas 99 tampil 99+, teks pembaca layar tetap angka asli", () => {
    render(<NavList admin level="super" queues={{ ...QUEUES, tickets_open: 150 }} />);
    expect(within(navLink("Tiket")).getByText("99+")).toBeInTheDocument();
    expect(badgeText("Tiket")).toBe("150 tiket menunggu balasan");
  });
  it("angka uang null: tanpa lencana Pencairan", () => {
    render(<NavList admin level="super" queues={{ ...QUEUES, payouts_pending: null, refunds_pending: null }} />);
    expect(badgeText("Pencairan")).toBeNull();
  });
  it("ikon menu admin unik", () => {
    const items = ADMIN_NAV.flatMap((group) => group.items);
    expect(new Set(items.map((item) => item.icon)).size).toBe(items.length);
  });
});
