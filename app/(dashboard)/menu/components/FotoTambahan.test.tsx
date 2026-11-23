import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const unggahFoto = vi.fn();
vi.mock("@/lib/unggah", () => ({ unggahFoto: (...a: unknown[]) => unggahFoto(...a) }));
import { FotoTambahan } from "./FotoTambahan";

const U = ["https://foto.test/a.jpg", "https://foto.test/b.jpg", "https://foto.test/c.jpg"];
const berkas = () => new File([new Uint8Array(10)], "f.png", { type: "image/png" });

beforeEach(() => { unggahFoto.mockReset(); });

describe("FotoTambahan", () => {
  it("unggah menambah URL di akhir; busy dilaporkan selama unggah", async () => {
    unggahFoto.mockResolvedValue({ data: { public_url: "https://foto.test/baru.jpg" } });
    const onChange = vi.fn(), onBusy = vi.fn();
    render(<FotoTambahan urls={U.slice(0, 1)} onChange={onChange} onBusy={onBusy} />);
    fireEvent.change(document.querySelector("input[type=file]") as HTMLInputElement, { target: { files: [berkas()] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([U[0], "https://foto.test/baru.jpg"]));
    expect(unggahFoto.mock.calls[0][1]).toBe("menu");
    expect(onBusy.mock.calls).toEqual([[true], [false]]);
  });

  it("hapus & geser urutan", async () => {
    const onChange = vi.fn();
    render(<FotoTambahan urls={U} onChange={onChange} onBusy={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Hapus foto tambahan 2" }));
    expect(onChange).toHaveBeenLastCalledWith([U[0], U[2]]);
    await userEvent.click(screen.getByRole("button", { name: "Geser foto 1 ke kanan" }));
    expect(onChange).toHaveBeenLastCalledWith([U[1], U[0], U[2]]);
    expect(screen.getByRole("button", { name: "Geser foto 1 ke kiri" })).toBeDisabled();
  });

  it("sudah 4 foto → tombol tambah hilang; galat unggah ditampilkan", async () => {
    const { rerender } = render(<FotoTambahan urls={[...U, "https://foto.test/d.jpg"]} onChange={vi.fn()} onBusy={vi.fn()} />);
    expect(document.querySelector("input[type=file]")).toBeNull();
    unggahFoto.mockResolvedValue({ error: { code: "X", message: "Foto gagal diunggah. Coba lagi" } });
    rerender(<FotoTambahan urls={[]} onChange={vi.fn()} onBusy={vi.fn()} />);
    fireEvent.change(document.querySelector("input[type=file]") as HTMLInputElement, { target: { files: [berkas()] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Foto gagal diunggah. Coba lagi");
  });
});
