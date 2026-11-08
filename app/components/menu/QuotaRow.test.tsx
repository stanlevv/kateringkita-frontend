import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { menus } from "@/lib/fixtures/menus";
import type { MerchantMenu } from "@/types/menu";
import { QuotaRow } from "./QuotaRow";

const ayam = menus()[0]; // kuota 40, terjual 22, ditahan 3 -> tersedia 15
const m = (p: Partial<MerchantMenu>): MerchantMenu => ({ ...ayam, ...p });

describe("QuotaRow (brief §5)", () => {
  it("baris: nama, badge stok ikon+teks, Tersedia · Ditahan · Terjual", () => {
    render(<QuotaRow menu={ayam} onUbah={vi.fn()} />);
    expect(screen.getByText("Nasi Ayam Bakar Madu")).toBeInTheDocument();
    expect(screen.getByText("Aman").closest("span")?.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Tersedia 15 · Ditahan 3 · Terjual 22")).toBeInTheDocument();
  });
  it("DB-E4 batas bawah = terjual + ditahan: tombol − nonaktif + keterangan", () => {
    render(<QuotaRow menu={m({ quota_today: 25, available: 0 })} onUbah={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Kurangi/ })).toBeDisabled();
    expect(screen.getByText("Tidak bisa di bawah porsi yang sudah dipesan")).toBeInTheDocument();
  });
  it("Review Focus 3: ketik di bawah batas -> ditolak, nilai kembali", async () => {
    const onUbah = vi.fn();
    render(<QuotaRow menu={m({ quota_today: 30, available: 5 })} onUbah={onUbah} />);
    const input = screen.getByRole("spinbutton");
    await userEvent.clear(input);
    await userEvent.type(input, "20");
    fireEvent.blur(input);
    expect(input).toHaveValue(30);
    expect(onUbah).not.toHaveBeenCalled();
  });
  it("DB-N3 menu habis punya +5 / +10", async () => {
    const onUbah = vi.fn();
    render(<QuotaRow menu={m({ quota_today: 25, available: 0 })} onUbah={onUbah} />);
    expect(screen.getByText("Habis")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /\+5/ }));
    expect(onUbah).toHaveBeenCalledWith(30);
    await userEvent.click(screen.getByRole("button", { name: /\+10/ }));
    expect(onUbah).toHaveBeenCalledWith(35);
  });
  it("menu aman tidak punya tombol cepat", () => {
    render(<QuotaRow menu={ayam} onUbah={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /\+5/ })).toBeNull();
  });
  it("AUD-04 memanggil onDelta saat tombol cepat +5 / +10 ditekan", async () => {
    const onDelta = vi.fn();
    render(<QuotaRow menu={m({ quota_today: 25, available: 0 })} onUbah={vi.fn()} onDelta={onDelta} />);
    await userEvent.click(screen.getByRole("button", { name: /\+5/ }));
    expect(onDelta).toHaveBeenCalledWith(5);
    await userEvent.click(screen.getByRole("button", { name: /\+10/ }));
    expect(onDelta).toHaveBeenCalledWith(10);
  });
});
