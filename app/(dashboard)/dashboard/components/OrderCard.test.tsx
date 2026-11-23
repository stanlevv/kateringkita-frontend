// Test OrderCard: tampilan delapan status pesanan, isi kartu, Chat WA, tombol aksi, timer tahan, dan sorot pesanan baru.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { applyHoldExpiry } from "@/lib/dashboard";
import { orders } from "@/lib/fixtures/orders";
import type { MerchantOrder } from "@/types/order";
import { OrderCard } from "./OrderCard";

// Pesanan fixture pertama: KK-20261031-7QF2, holding, bayar tunai, opsi Sambal pisah, ada catatan.
const baseOrder = orders()[0];
const orderWith = (patch: Partial<MerchantOrder>): MerchantOrder => ({ ...baseOrder, ...patch });
const renderCard = (order: MerchantOrder, extra: Partial<React.ComponentProps<typeof OrderCard>> = {}) => {
  const handlers = { onAction: vi.fn(), onReject: vi.fn(), onSlip: vi.fn() };
  render(
    <OrderCard order={order} holdSecondsLeft={order.status === "holding" ? 200 : null} {...handlers} {...extra} />,
  );
  return handlers;
};

const STATUS_CASES: [string, Partial<MerchantOrder>, string, string | null][] = [
  [
    "holding tunai",
    { status: "holding", payment_method: "cod", payment_status: "unpaid" },
    "Menunggu konfirmasi",
    "Konfirmasi",
  ],
  [
    "holding bayar online belum lunas",
    { status: "holding", payment_method: "online", payment_status: "unpaid" },
    "Menunggu pembayaran",
    null,
  ],
  ["confirmed", { status: "confirmed", hold_until: null, seconds_left: null }, "Dikonfirmasi", "Mulai masak"],
  ["cooking", { status: "cooking", cooking_at: baseOrder.created_at }, "Dimasak", "Siap diambil"],
  ["ready", { status: "ready" }, "Siap diambil", "Selesai"],
  ["completed", { status: "completed" }, "Selesai", null],
  ["cancelled", { status: "cancelled", cancel_reason: "Stok habis", cancelled_by: "merchant" }, "Dibatalkan", null],
  ["expired", { status: "expired", cancel_reason: "Tidak dikonfirmasi tepat waktu" }, "Kadaluarsa", null],
];

describe("OrderCard 8 tampilan status (brief §4)", () => {
  it.each(STATUS_CASES)("%s: badge ikon+teks dan satu aksi utama yang benar", (_, patch, badge, primaryLabel) => {
    renderCard(orderWith(patch));
    const article = screen.getByRole("article");
    const label = within(article).getAllByText(badge)[0];
    expect(label.closest("span")?.querySelector("svg")).not.toBeNull();
    const primaryButton = article.querySelector("[data-aksi-utama]");
    if (primaryLabel) expect(primaryButton).toHaveTextContent(primaryLabel);
    else expect(primaryButton).toBeNull();
  });

  it("F26 menunggu bayar: tanpa tombol utama, keterangan diterima otomatis", () => {
    renderCard(orderWith({ status: "holding", payment_method: "va", payment_status: "unpaid" }));
    expect(screen.getByText("Diterima otomatis setelah lunas")).toBeInTheDocument();
  });

  it("isi kartu: kode, nama, telepon, opsi item, titik ambil, waktu ambil, catatan, pembayaran", () => {
    renderCard(baseOrder);
    expect(screen.getByText("KK-20261031-7QF2")).toBeInTheDocument();
    expect(screen.getByText(/Rafli Ramadhan/)).toBeInTheDocument();
    expect(screen.getByText(/0812-3456-7890/)).toBeInTheDocument();
    expect(screen.getByText("+Sambal pisah")).toBeInTheDocument();
    expect(screen.getByText(baseOrder.pickup_point!.name)).toBeInTheDocument();
    expect(screen.getByText("Ambil: secepatnya")).toBeInTheDocument();
    expect(screen.getByText(/Sambal dipisah, sendok 3 pcs/)).toBeInTheDocument();
    expect(screen.getByText("Tunai")).toBeInTheDocument();
  });

  it("DB-N4 Chat WA membuka wa.me di tab baru", () => {
    renderCard(baseOrder);
    const waLink = screen.getByRole("link", { name: /Chat WA/ });
    expect(waLink).toHaveAttribute("href", expect.stringMatching(/^\/api\/pesanan\/KK-[\w-]+\/wa$/));
    expect(waLink).toHaveAttribute("target", "_blank");
    expect(waLink).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("aksi utama, Tolak, dan Lihat slip memanggil handler", async () => {
    const handlers = renderCard(baseOrder);
    await userEvent.click(screen.getByRole("button", { name: "Konfirmasi" }));
    expect(handlers.onAction).toHaveBeenCalledWith("confirm");
    await userEvent.click(screen.getByRole("button", { name: "Tolak" }));
    expect(handlers.onReject).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Lihat slip" }));
    expect(handlers.onSlip).toHaveBeenCalled();
  });

  it("DB-A2 saat ditunda: tombol menampilkan proses dan nonaktif", () => {
    renderCard(baseOrder, { pending: "confirm" });
    const button = screen.getByRole("button", { name: /Mengonfirmasi/ });
    expect(button).toBeDisabled();
  });
});

describe("DB-A4 timer tahan", () => {
  it("sisa 59 dtk -> Segera dengan nada error", () => {
    renderCard(baseOrder, { holdSecondsLeft: 59 });
    const timer = screen.getByText(/Segera/);
    expect(timer).toHaveTextContent("00:59");
    expect(timer.closest("[data-timer]")).toHaveClass("text-danger");
  });
  it("sisa > 60 dtk -> mm:ss tanpa Segera", () => {
    renderCard(baseOrder, { holdSecondsLeft: 220 });
    expect(screen.getByText("03:40")).toBeInTheDocument();
    expect(screen.queryByText(/Segera/)).toBeNull();
  });
  it("sisa 0 -> Kadaluarsa tanpa aksi utama", () => {
    renderCard(applyHoldExpiry([orderWith({ hold_until: new Date(10_000).toISOString() })], 20_000)[0], {
      holdSecondsLeft: null,
    });
    expect(screen.getAllByText("Kadaluarsa").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Konfirmasi" })).toBeNull();
  });
  it("progress bar tahan ada di tepi atas", () => {
    renderCard(baseOrder, { holdSecondsLeft: 120 });
    expect(screen.getByRole("progressbar", { name: /Sisa waktu/ })).toBeInTheDocument();
  });
});

describe("DB-A3 sorot pesanan baru", () => {
  it("kartu baru ditandai", () => {
    renderCard(baseOrder, { isNew: true });
    expect(screen.getByRole("article")).toHaveAttribute("data-baru", "true");
    expect(screen.getByText("Baru")).toBeInTheDocument();
  });
});
