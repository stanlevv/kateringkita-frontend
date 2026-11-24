// Test FileDrop: tolak file terlalu besar dan format selain JPG/PNG/WebP.
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileDrop } from "./FileDrop";

const ONE_MB = 1024 * 1024;
function chooseFile(file: File) {
  const input = document.querySelector("input[type=file]") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}
const makeFile = (type: string, size: number) => new File([new Uint8Array(size)], "f", { type });

describe("FileDrop (MF foto)", () => {
  it("file 6 MB -> onError ukuran, onFile tidak dipanggil", () => {
    const onFile = vi.fn(),
      onError = vi.fn();
    render(<FileDrop maxBytes={5 * ONE_MB} onFile={onFile} onError={onError} />);
    chooseFile(makeFile("image/png", 6 * ONE_MB));
    expect(onError).toHaveBeenCalledWith("Ukuran foto maksimal 5 MB.");
    expect(onFile).not.toHaveBeenCalled();
  });
  it("image/svg+xml ditolak", () => {
    const onFile = vi.fn(),
      onError = vi.fn();
    render(<FileDrop maxBytes={5 * ONE_MB} onFile={onFile} onError={onError} />);
    chooseFile(makeFile("image/svg+xml", 10));
    expect(onError).toHaveBeenCalledWith("Format foto harus JPG, PNG, atau WebP.");
    expect(onFile).not.toHaveBeenCalled();
  });
  it("jpeg valid diteruskan; tombol berlabel dapat difokus", () => {
    const onFile = vi.fn();
    render(<FileDrop maxBytes={5 * ONE_MB} onFile={onFile} onError={vi.fn()} />);
    expect(screen.getByRole("button", { name: /pilih foto/i })).toBeInTheDocument();
    chooseFile(makeFile("image/jpeg", 100));
    expect(onFile).toHaveBeenCalledOnce();
  });
});
