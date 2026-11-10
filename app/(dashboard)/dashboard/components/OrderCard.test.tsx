import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { terapkanWaktu } from "@/lib/dashboard";
import { orders } from "@/lib/fixtures/orders";
import type { MerchantOrder } from "@/types/order";
import { OrderCard } from "./OrderCard";

const dasar = orders()[0]; // KK-20261031-7QF2, holding tunai, Sambal pisah, catatan
const o = (p: Partial<MerchantOrder>): MerchantOrder => ({ ...dasar, ...p });
const kartu = (order: MerchantOrder, extra: Partial<React.ComponentProps<typeof OrderCard>> = {}) => {
  const fn = { onAksi: vi.fn(), onTolak: vi.fn(), onSlip: vi.fn() };
  render(<OrderCard order={order} sisa={order.status === "holding" ? 200 : null} {...fn} {...extra} />);
  return fn;
};

const TAMPILAN: [string, Partial<MerchantOrder>, string, string | null][] = [
  ["holding tunai", { status: "holding", payment_method: "cod", payment_status: "unpaid" }, "Menunggu konfirmasi", "Konfirmasi"],
  ["holding bayar online belum lunas", { status: "holding", payment_method: "online", payment_status: "unpaid" }, "Menunggu pembayaran", null],
  ["confirmed", { status: "confirmed", hold_until: null, seconds_left: null }, "Dikonfirmasi", "Mulai masak"],
  ["cooking", { status: "cooking", cooking_at: dasar.created_at }, "Dimasak", "Siap diambil"],
  ["ready", { status: "ready" }, "Siap diambil", "Selesai"],
  ["completed", { status: "completed" }, "Selesai", null],
  ["cancelled", { status: "cancelled", cancel_reason: "Stok habis", cancelled_by: "merchant" }, "Dibatalkan", null],
  ["expired", { status: "expired", cancel_reason: "Tidak dikonfirmasi tepat waktu" }, "Kadaluarsa", null],
];

describe("OrderCard 8 tampilan status (brief §4)", () => {
  it.each(TAMPILAN)("%s: badge ikon+teks dan satu aksi utama yang benar", (_, p, badge, utama) => {
    kartu(o(p));
    const art = screen.getByRole("article");
    const label = within(art).getAllByText(badge)[0];
    expect(label.closest("span")?.querySelector("svg")).not.toBeNull();
    const utamaBtn = art.querySelector("[data-aksi-utama]");
    if (utama) expect(utamaBtn).toHaveTextContent(utama);
    else expect(utamaBtn).toBeNull();
  });

  it("F26 menunggu bayar: tanpa tombol utama, keterangan diterima otomatis", () => {
    kartu(o({ status: "holding", payment_method: "va", payment_status: "unpaid" }));
    expect(screen.getByText("Diterima otomatis setelah lunas")).toBeInTheDocument();
  });

  it("isi kartu: kode, nama, telepon, opsi item, titik ambil, waktu ambil, catatan, pembayaran", () => {
    kartu(dasar);
    expect(screen.getByText("KK-20261031-7QF2")).toBeInTheDocument();
    expect(screen.getByText(/Rafli Ramadhan/)).toBeInTheDocument();
    expect(screen.getByText(/0812-3456-7890/)).toBeInTheDocument();
    expect(screen.getByText("+Sambal pisah")).toBeInTheDocument();
    expect(screen.getByText(dasar.pickup_point!.name)).toBeInTheDocument();
    expect(screen.getByText("Ambil: secepatnya")).toBeInTheDocument();
    expect(screen.getByText(/Sambal dipisah, sendok 3 pcs/)).toBeInTheDocument();
    expect(screen.getByText("Tunai")).toBeInTheDocument();
  });

  it("DB-N4 Chat WA membuka wa.me di tab baru", () => {
    kartu(dasar);
    const wa = screen.getByRole("link", { name: /Chat WA/ });
    expect(wa).toHaveAttribute("href", expect.stringMatching(/^\/api\/pesanan\/KK-[\w-]+\/wa$/));
    expect(wa).toHaveAttribute("target", "_blank");
    expect(wa).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("aksi utama, Tolak, dan Lihat slip memanggil handler", async () => {
    const fn = kartu(dasar);
    await userEvent.click(screen.getByRole("button", { name: "Konfirmasi" }));
    expect(fn.onAksi).toHaveBeenCalledWith("confirm");
    await userEvent.click(screen.getByRole("button", { name: "Tolak" }));
    expect(fn.onTolak).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Lihat slip" }));
    expect(fn.onSlip).toHaveBeenCalled();
  });

  it("DB-A2 saat ditunda: tombol menampilkan proses dan nonaktif", () => {
    kartu(dasar, { pending: "confirm" });
    const b = screen.getByRole("button", { name: /Mengonfirmasi/ });
    expect(b).toBeDisabled();
  });
});

describe("DB-A4 timer tahan", () => {
  it("sisa 59 dtk -> Segera dengan nada error", () => {
    kartu(dasar, { sisa: 59 });
    const t = screen.getByText(/Segera/);
    expect(t).toHaveTextContent("00:59");
    expect(t.closest("[data-timer]")).toHaveClass("text-danger");
  });
  it("sisa > 60 dtk -> mm:ss tanpa Segera", () => {
    kartu(dasar, { sisa: 220 });
    expect(screen.getByText("03:40")).toBeInTheDocument();
    expect(screen.queryByText(/Segera/)).toBeNull();
  });
  it("sisa 0 -> Kadaluarsa tanpa aksi utama", () => {
    kartu(terapkanWaktu([o({ hold_until: new Date(10_000).toISOString() })], 20_000)[0], { sisa: null });
    expect(screen.getAllByText("Kadaluarsa").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Konfirmasi" })).toBeNull();
  });
  it("progress bar tahan ada di tepi atas", () => {
    kartu(dasar, { sisa: 120 });
    expect(screen.getByRole("progressbar", { name: /Sisa waktu/ })).toBeInTheDocument();
  });
});

describe("DB-A3 sorot pesanan baru", () => {
  it("kartu baru ditandai", () => {
    kartu(dasar, { baru: true });
    expect(screen.getByRole("article")).toHaveAttribute("data-baru", "true");
    expect(screen.getByText("Baru")).toBeInTheDocument();
  });
});
