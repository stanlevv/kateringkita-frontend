import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const replyToTicket = vi.fn();
const closeTicket = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/admin/tickets", () => ({
  replyToTicket: (...a: unknown[]) => replyToTicket(...a),
  closeTicket: (...a: unknown[]) => closeTicket(...a),
}));
import { Toaster } from "@/app/components/ui/Toast";
import { BalasTiket } from "./TicketReplyForm";
import { TutupTiket } from "./CloseTicketButton";

const KODE = "TK-20261113-7QPX";
const isian = () => screen.getByRole("textbox", { name: /Balasan untuk pembeli/ });
const kirim = () => screen.getByRole("button", { name: "Kirim balasan" });

beforeEach(() => {
  refresh.mockReset();
  replyToTicket.mockReset().mockResolvedValue({ data: null });
  closeTicket.mockReset().mockResolvedValue({ data: null });
});

describe("BalasTiket", () => {
  it("berhasil: penghitung, kirim teks, toast, muat ulang, isian dikosongkan", async () => {
    render(
      <>
        <Toaster />
        <BalasTiket code={KODE} />
      </>,
    );
    expect(kirim()).toBeDisabled();
    expect(screen.getByText("0/2000")).toBeInTheDocument();
    fireEvent.change(isian(), { target: { value: "VA Anda sudah lunas." } });
    expect(screen.getByText("20/2000")).toBeInTheDocument();
    expect(isian()).toHaveAttribute("maxLength", "2000");
    await userEvent.click(kirim());
    expect(replyToTicket).toHaveBeenCalledWith(KODE, "VA Anda sudah lunas.");
    expect(await screen.findByText("Balasan terkirim. Pembeli mendapat notifikasi.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    expect(isian()).toHaveValue("");
  });

  it("isian hanya spasi: tombol tetap mati, aksi tidak dipanggil", async () => {
    render(<BalasTiket code={KODE} />);
    fireEvent.change(isian(), { target: { value: "   " } });
    expect(kirim()).toBeDisabled();
    fireEvent.submit(isian().closest("form")!);
    expect(replyToTicket).not.toHaveBeenCalled();
  });

  it("galat validasi: pesan fields.body di bawah isian, teks tetap, tanpa muat ulang; mengetik menghapus galat", async () => {
    replyToTicket.mockResolvedValue({
      error: { code: "VALIDATION_ERROR", message: "Data tidak valid.", fields: { body: ["Pesan 1–2000 karakter."] } },
    });
    render(<BalasTiket code={KODE} />);
    fireEvent.change(isian(), { target: { value: "Halo" } });
    await userEvent.click(kirim());
    expect(await screen.findByText("Pesan 1–2000 karakter.")).toBeInTheDocument();
    expect(isian()).toHaveAttribute("aria-invalid", "true");
    expect(isian()).toHaveValue("Halo");
    expect(refresh).not.toHaveBeenCalled();
    fireEvent.change(isian(), { target: { value: "Halo lagi" } });
    expect(screen.queryByText("Pesan 1–2000 karakter.")).toBeNull();
  });

  it("galat validasi tanpa fields: error.message di bawah isian", async () => {
    replyToTicket.mockResolvedValue({ error: { code: "VALIDATION_ERROR", message: "Periksa kembali balasan." } });
    render(<BalasTiket code={KODE} />);
    fireEvent.change(isian(), { target: { value: "Halo" } });
    await userEvent.click(kirim());
    expect(await screen.findByText("Periksa kembali balasan.")).toBeInTheDocument();
  });

  it("tiket sudah ditutup (409): toast pesan backend + muat ulang", async () => {
    replyToTicket.mockResolvedValue({
      error: { code: "TICKET_CLOSED", message: "Tiket sudah ditutup. Buat tiket baru bila masih perlu bantuan." },
    });
    render(
      <>
        <Toaster />
        <BalasTiket code={KODE} />
      </>,
    );
    fireEvent.change(isian(), { target: { value: "Halo" } });
    await userEvent.click(kirim());
    expect(
      await screen.findByText("Tiket sudah ditutup. Buat tiket baru bila masih perlu bantuan."),
    ).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("aksi melempar (jaringan): toast, teks tetap, tanpa muat ulang", async () => {
    replyToTicket.mockRejectedValue(new Error("fetch failed"));
    render(
      <>
        <Toaster />
        <BalasTiket code={KODE} />
      </>,
    );
    fireEvent.change(isian(), { target: { value: "Halo" } });
    await userEvent.click(kirim());
    expect(await screen.findByText("Server tidak dapat dihubungi. Coba lagi.")).toBeInTheDocument();
    expect(isian()).toHaveValue("Halo");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("kirim ganda dicegah selama menunggu", async () => {
    let selesai!: (v: unknown) => void;
    replyToTicket.mockReturnValue(
      new Promise((r) => {
        selesai = r;
      }),
    );
    render(<BalasTiket code={KODE} />);
    fireEvent.change(isian(), { target: { value: "Halo" } });
    await userEvent.click(kirim());
    const tombol = screen.getByRole("button", { name: "Mengirim…" });
    expect(tombol).toBeDisabled();
    fireEvent.submit(isian().closest("form")!);
    expect(replyToTicket).toHaveBeenCalledTimes(1);
    await act(async () => selesai({ data: null }));
  });
});

describe("TutupTiket", () => {
  it("minta konfirmasi dulu; berhasil -> toast + muat ulang, dialog menutup", async () => {
    render(
      <>
        <Toaster />
        <TutupTiket code={KODE} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Tutup tiket" }));
    expect(closeTicket).not.toHaveBeenCalled();
    const dlg = within(screen.getByRole("dialog", { name: "Tutup tiket" }));
    expect(dlg.getByText(/tidak bisa membalas tiket ini lagi/)).toBeInTheDocument();
    await userEvent.click(dlg.getByRole("button", { name: "Tutup tiket" }));
    expect(closeTicket).toHaveBeenCalledWith(KODE);
    expect(await screen.findByText(`Tiket ${KODE} ditutup.`)).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tutup tiket" })).toBeNull());
  });

  it("Batal tidak memanggil aksi", async () => {
    render(<TutupTiket code={KODE} />);
    await userEvent.click(screen.getByRole("button", { name: "Tutup tiket" }));
    await userEvent.click(
      within(screen.getByRole("dialog", { name: "Tutup tiket" })).getByRole("button", { name: "Batal" }),
    );
    expect(screen.queryByRole("dialog", { name: "Tutup tiket" })).toBeNull();
    expect(closeTicket).not.toHaveBeenCalled();
  });

  it("gagal: toast pesan backend, dialog tetap terbuka, tanpa muat ulang", async () => {
    closeTicket.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Gagal menutup tiket." } });
    render(
      <>
        <Toaster />
        <TutupTiket code={KODE} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Tutup tiket" }));
    await userEvent.click(
      within(screen.getByRole("dialog", { name: "Tutup tiket" })).getByRole("button", { name: "Tutup tiket" }),
    );
    expect(await screen.findByText("Gagal menutup tiket.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Tutup tiket" })).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
