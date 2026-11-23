import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const replyToTicket = vi.fn();
const closeTicket = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/admin/tickets", () => ({
  replyToTicket: (...args: unknown[]) => replyToTicket(...args),
  closeTicket: (...args: unknown[]) => closeTicket(...args),
}));
import { Toaster } from "@/app/components/ui/Toast";
import { TicketReplyForm } from "./TicketReplyForm";
import { CloseTicketButton } from "./CloseTicketButton";

const TICKET_CODE = "TK-20261113-7QPX";
const replyInput = () => screen.getByRole("textbox", { name: /Balasan untuk pembeli/ });
const sendButton = () => screen.getByRole("button", { name: "Kirim balasan" });

beforeEach(() => {
  refresh.mockReset();
  replyToTicket.mockReset().mockResolvedValue({ data: null });
  closeTicket.mockReset().mockResolvedValue({ data: null });
});

describe("TicketReplyForm", () => {
  it("berhasil: penghitung, kirim teks, toast, muat ulang, isian dikosongkan", async () => {
    render(
      <>
        <Toaster />
        <TicketReplyForm code={TICKET_CODE} />
      </>,
    );
    expect(sendButton()).toBeDisabled();
    expect(screen.getByText("0/2000")).toBeInTheDocument();
    fireEvent.change(replyInput(), { target: { value: "VA Anda sudah lunas." } });
    expect(screen.getByText("20/2000")).toBeInTheDocument();
    expect(replyInput()).toHaveAttribute("maxLength", "2000");
    await userEvent.click(sendButton());
    expect(replyToTicket).toHaveBeenCalledWith(TICKET_CODE, "VA Anda sudah lunas.");
    expect(await screen.findByText("Balasan terkirim. Pembeli mendapat notifikasi.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    expect(replyInput()).toHaveValue("");
  });

  it("isian hanya spasi: tombol tetap mati, aksi tidak dipanggil", async () => {
    render(<TicketReplyForm code={TICKET_CODE} />);
    fireEvent.change(replyInput(), { target: { value: "   " } });
    expect(sendButton()).toBeDisabled();
    fireEvent.submit(replyInput().closest("form")!);
    expect(replyToTicket).not.toHaveBeenCalled();
  });

  it("galat validasi: pesan fields.body di bawah isian, teks tetap, tanpa muat ulang; mengetik menghapus galat", async () => {
    replyToTicket.mockResolvedValue({
      error: { code: "VALIDATION_ERROR", message: "Data tidak valid.", fields: { body: ["Pesan 1–2000 karakter."] } },
    });
    render(<TicketReplyForm code={TICKET_CODE} />);
    fireEvent.change(replyInput(), { target: { value: "Halo" } });
    await userEvent.click(sendButton());
    expect(await screen.findByText("Pesan 1–2000 karakter.")).toBeInTheDocument();
    expect(replyInput()).toHaveAttribute("aria-invalid", "true");
    expect(replyInput()).toHaveValue("Halo");
    expect(refresh).not.toHaveBeenCalled();
    fireEvent.change(replyInput(), { target: { value: "Halo lagi" } });
    expect(screen.queryByText("Pesan 1–2000 karakter.")).toBeNull();
  });

  it("galat validasi tanpa fields: error.message di bawah isian", async () => {
    replyToTicket.mockResolvedValue({ error: { code: "VALIDATION_ERROR", message: "Periksa kembali balasan." } });
    render(<TicketReplyForm code={TICKET_CODE} />);
    fireEvent.change(replyInput(), { target: { value: "Halo" } });
    await userEvent.click(sendButton());
    expect(await screen.findByText("Periksa kembali balasan.")).toBeInTheDocument();
  });

  it("tiket sudah ditutup (409): toast pesan backend + muat ulang", async () => {
    replyToTicket.mockResolvedValue({
      error: { code: "TICKET_CLOSED", message: "Tiket sudah ditutup. Buat tiket baru bila masih perlu bantuan." },
    });
    render(
      <>
        <Toaster />
        <TicketReplyForm code={TICKET_CODE} />
      </>,
    );
    fireEvent.change(replyInput(), { target: { value: "Halo" } });
    await userEvent.click(sendButton());
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
        <TicketReplyForm code={TICKET_CODE} />
      </>,
    );
    fireEvent.change(replyInput(), { target: { value: "Halo" } });
    await userEvent.click(sendButton());
    expect(await screen.findByText("Server tidak dapat dihubungi. Coba lagi.")).toBeInTheDocument();
    expect(replyInput()).toHaveValue("Halo");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("kirim ganda dicegah selama menunggu", async () => {
    let resolveReply!: (value: unknown) => void;
    replyToTicket.mockReturnValue(
      new Promise((resolve) => {
        resolveReply = resolve;
      }),
    );
    render(<TicketReplyForm code={TICKET_CODE} />);
    fireEvent.change(replyInput(), { target: { value: "Halo" } });
    await userEvent.click(sendButton());
    const button = screen.getByRole("button", { name: "Mengirim…" });
    expect(button).toBeDisabled();
    fireEvent.submit(replyInput().closest("form")!);
    expect(replyToTicket).toHaveBeenCalledTimes(1);
    await act(async () => resolveReply({ data: null }));
  });
});

describe("CloseTicketButton", () => {
  it("minta konfirmasi dulu; berhasil -> toast + muat ulang, dialog menutup", async () => {
    render(
      <>
        <Toaster />
        <CloseTicketButton code={TICKET_CODE} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Tutup tiket" }));
    expect(closeTicket).not.toHaveBeenCalled();
    const dialog = within(screen.getByRole("dialog", { name: "Tutup tiket" }));
    expect(dialog.getByText(/tidak bisa membalas tiket ini lagi/)).toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Tutup tiket" }));
    expect(closeTicket).toHaveBeenCalledWith(TICKET_CODE);
    expect(await screen.findByText(`Tiket ${TICKET_CODE} ditutup.`)).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tutup tiket" })).toBeNull());
  });

  it("Batal tidak memanggil aksi", async () => {
    render(<CloseTicketButton code={TICKET_CODE} />);
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
        <CloseTicketButton code={TICKET_CODE} />
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
