// Test aplikasi pesan dari meja (TableMenuApp): toko dan meja tampil, menu habis tidak bisa ditambah, alur tambah menu
// (dengan opsi) -> keranjang -> Pesan & bayar -> Midtrans, keranjang baru dikosongkan saat diteruskan, dan toko tutup.
// Server action createTableOrder/payTableOrder dan router dipalsukan (vi.mock); localStorage memakai milik jsdom.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TableMenu } from "@/types/table";

const push = vi.fn();
const createTableOrder = vi.fn();
const payTableOrder = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/app/actions/table", () => ({
  createTableOrder: (...args: unknown[]) => createTableOrder(...args),
  payTableOrder: (...args: unknown[]) => payTableOrder(...args),
}));

import { TableMenuApp } from "./TableMenuApp";

const menu = (overrides: Partial<TableMenu["menus"][number]>) => ({
  id: 1,
  name: "Nasi Ayam",
  image_url: null,
  price: 15000,
  unit_label: "porsi",
  category: { id: 1, name: "Nasi", slug: "nasi" },
  available: 20,
  badge: "available" as const,
  rating_avg: 0,
  rating_count: 0,
  description: "Ayam goreng sambal",
  min_order_qty: 1,
  options: [],
  ...overrides,
});
const data: TableMenu = {
  table: { label: "5" },
  merchant: {
    slug: "dapur",
    business_name: "Dapur Siti",
    description: null,
    logo_url: null,
    is_open: true,
    open_time: "07:00",
    close_time: "16:00",
  },
  menus: [
    menu({}),
    menu({
      id: 2,
      name: "Es Teh",
      price: 5000,
      category: { id: 2, name: "Minuman", slug: "minuman" },
      options: [{ id: 9, name: "Less sugar", extra_price: 0 }],
    }),
    menu({ id: 3, name: "Tumis Habis", badge: "sold_out", available: 0 }),
  ],
};

beforeEach(() => {
  localStorage.clear();
  // jsdom belum punya IntersectionObserver
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("menu pesan dari meja", () => {
  it("toko & meja tampil; menu habis tidak bisa ditambah", () => {
    render(<TableMenuApp token="t0k3n" data={data} />);
    expect(screen.getByRole("heading", { level: 1, name: "Dapur Siti" })).toBeInTheDocument();
    expect(screen.getByText("MEJA 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tambah Tumis Habis" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Scan meja lain" })).toHaveAttribute("href", "/meja?pindai=1");
  });

  it("tambah menu (dengan opsi lewat panel) → baki menghitung total → pesan & bayar diteruskan ke Midtrans", async () => {
    const user = userEvent.setup();
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, origin: "http://localhost:3000", assign });
    createTableOrder.mockResolvedValue({ data: { code: "KK-1", guest_token: "tamu-1" } });
    payTableOrder.mockResolvedValue({ data: { payment_url: "https://app.sandbox.midtrans.com/snap/x" } });
    render(<TableMenuApp token="t0k3n" data={data} />);

    await user.click(screen.getByRole("button", { name: "Tambah Nasi Ayam" }));
    await user.click(screen.getByRole("button", { name: "Tambah Nasi Ayam" }));
    await user.click(screen.getByRole("button", { name: "Tambah Es Teh" }));
    const panel = screen.getByRole("dialog", { name: "Es Teh" });
    await user.click(within(panel).getByRole("button", { name: /Less sugar/ }));
    await user.click(within(panel).getByRole("button", { name: /Tambah ke pesanan/ }));
    expect(screen.getByText("Rp 35.000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Lihat pesanan/ }));
    const cart = screen.getByRole("dialog", { name: "Pesanan Meja 5" });
    await user.click(within(cart).getByRole("button", { name: "Pesan & bayar" }));
    expect(within(cart).getByRole("alert")).toHaveTextContent("Isi nama pemesan");
    await user.type(within(cart).getByLabelText(/Nama pemesan/), "Andi");
    await user.click(within(cart).getByRole("button", { name: "Pesan & bayar" }));

    expect(createTableOrder).toHaveBeenCalledWith("t0k3n", {
      items: [
        { menu_id: 1, qty: 2, option_ids: [] },
        { menu_id: 2, qty: 1, option_ids: [9] },
      ],
      customer_name: "Andi",
      customer_phone: null,
      note: null,
    });
    expect(payTableOrder).toHaveBeenCalledWith("KK-1", "tamu-1", "http://localhost:3000/meja/pesanan/KK-1");
    expect(assign).toHaveBeenCalledWith("https://app.sandbox.midtrans.com/snap/x");
    expect(JSON.parse(localStorage.getItem("kk-tamu:KK-1")!)).toEqual({ tamu: "tamu-1", meja: "t0k3n" });
  });

  it("selama menunggu tautan bayar, isi & subtotal pesanan tidak hilang; baru dikosongkan saat diteruskan", async () => {
    const user = userEvent.setup();
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, origin: "http://localhost:3000", assign });
    createTableOrder.mockResolvedValue({ data: { code: "KK-2", guest_token: "tamu-2" } });
    let resolvePayment!: (value: unknown) => void;
    payTableOrder.mockReturnValue(
      new Promise((resolve) => {
        resolvePayment = resolve;
      }),
    );
    render(<TableMenuApp token="t0k3n" data={data} />);

    await user.click(screen.getByRole("button", { name: "Tambah Nasi Ayam" }));
    await user.click(screen.getByRole("button", { name: /Lihat pesanan/ }));
    const cart = screen.getByRole("dialog", { name: "Pesanan Meja 5" });
    await user.type(within(cart).getByLabelText(/Nama pemesan/), "Andi");
    await user.click(within(cart).getByRole("button", { name: "Pesan & bayar" }));

    expect(payTableOrder).toHaveBeenCalled();
    expect(within(cart).getByText("Nasi Ayam")).toBeInTheDocument();
    expect(within(cart).queryByText("Rp 0")).not.toBeInTheDocument();
    expect(localStorage.getItem("kk-keranjang:t0k3n")).not.toBeNull();

    resolvePayment({ data: { payment_url: "https://app.sandbox.midtrans.com/snap/y" } });
    await vi.waitFor(() => expect(assign).toHaveBeenCalledWith("https://app.sandbox.midtrans.com/snap/y"));
    expect(localStorage.getItem("kk-keranjang:t0k3n")).toBeNull();
  });

  it("toko tutup → semua tombol tambah mati dan ada pemberitahuan", () => {
    render(<TableMenuApp token="t0k3n" data={{ ...data, merchant: { ...data.merchant, is_open: false } }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Toko sedang tutup");
    expect(screen.getByRole("button", { name: "Tambah Nasi Ayam" })).toBeDisabled();
  });
});
