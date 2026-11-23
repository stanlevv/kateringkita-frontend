import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Toaster } from "@/app/components/ui/Toast";
import { PengumumanForm } from "./PengumumanForm";

const sendAnnouncement = vi.fn();
vi.mock("@/app/actions/admin/announcements", () => ({ sendAnnouncement: (...a: unknown[]) => sendAnnouncement(...a) }));

beforeEach(() => sendAnnouncement.mockReset());

describe("PengumumanForm", () => {
  it("kosong -> galat; terisi -> konfirmasi -> kirim -> toast jumlah penerima", async () => {
    sendAnnouncement.mockResolvedValue({ data: { sent: 12 } });
    render(
      <>
        <PengumumanForm />
        <Toaster />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Kirim pengumuman" }));
    expect(screen.getByText("Judul wajib diisi.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Penerima"), { target: { value: "all" } });
    fireEvent.change(screen.getByLabelText(/^Judul/), { target: { value: "Libur" } });
    fireEvent.change(screen.getByLabelText(/^Isi/), { target: { value: "Kampus libur besok." } });
    fireEvent.click(screen.getByRole("button", { name: "Kirim pengumuman" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Kirim" }));
    });
    expect(sendAnnouncement).toHaveBeenCalledWith({ audience: "all", title: "Libur", body: "Kampus libur besok." });
    expect(screen.getByText("Pengumuman terkirim ke 12 akun.")).toBeInTheDocument();
  });
});
