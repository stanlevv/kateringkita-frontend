// Test ExtraPhotos: unggah menambah alamat di akhir, hapus dan geser urutan, batas 4 foto, dan galat unggah.
// uploadPhoto dipalsukan (vi.mock).
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadPhoto = vi.fn();
vi.mock("@/lib/upload", () => ({ uploadPhoto: (...args: unknown[]) => uploadPhoto(...args) }));
import { ExtraPhotos } from "./ExtraPhotos";

const URLS = ["https://foto.test/a.jpg", "https://foto.test/b.jpg", "https://foto.test/c.jpg"];
const createFile = () => new File([new Uint8Array(10)], "f.png", { type: "image/png" });

beforeEach(() => {
  uploadPhoto.mockReset();
});

describe("ExtraPhotos", () => {
  it("unggah menambah URL di akhir; busy dilaporkan selama unggah", async () => {
    uploadPhoto.mockResolvedValue({ data: { public_url: "https://foto.test/baru.jpg" } });
    const onChange = vi.fn(),
      onBusy = vi.fn();
    render(<ExtraPhotos urls={URLS.slice(0, 1)} onChange={onChange} onBusy={onBusy} />);
    fireEvent.change(document.querySelector("input[type=file]") as HTMLInputElement, {
      target: { files: [createFile()] },
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([URLS[0], "https://foto.test/baru.jpg"]));
    expect(uploadPhoto.mock.calls[0][1]).toBe("menu");
    expect(onBusy.mock.calls).toEqual([[true], [false]]);
  });

  it("hapus & geser urutan", async () => {
    const onChange = vi.fn();
    render(<ExtraPhotos urls={URLS} onChange={onChange} onBusy={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Hapus foto tambahan 2" }));
    expect(onChange).toHaveBeenLastCalledWith([URLS[0], URLS[2]]);
    await userEvent.click(screen.getByRole("button", { name: "Geser foto 1 ke kanan" }));
    expect(onChange).toHaveBeenLastCalledWith([URLS[1], URLS[0], URLS[2]]);
    expect(screen.getByRole("button", { name: "Geser foto 1 ke kiri" })).toBeDisabled();
  });

  it("sudah 4 foto → tombol tambah hilang; galat unggah ditampilkan", async () => {
    const { rerender } = render(
      <ExtraPhotos urls={[...URLS, "https://foto.test/d.jpg"]} onChange={vi.fn()} onBusy={vi.fn()} />,
    );
    expect(document.querySelector("input[type=file]")).toBeNull();
    uploadPhoto.mockResolvedValue({ error: { code: "X", message: "Foto gagal diunggah. Coba lagi" } });
    rerender(<ExtraPhotos urls={[]} onChange={vi.fn()} onBusy={vi.fn()} />);
    fireEvent.change(document.querySelector("input[type=file]") as HTMLInputElement, {
      target: { files: [createFile()] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Foto gagal diunggah. Coba lagi");
  });
});
