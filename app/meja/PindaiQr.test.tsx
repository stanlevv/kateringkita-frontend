import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

import { PindaiQr } from "./PindaiQr";

const T = "18239d39dcdeb7616e3c5abb87316985";
const stop = vi.fn();
const getUserMedia = vi.fn();
let hasilDeteksi: { rawValue: string }[][] = [];

beforeEach(() => {
  vi.stubGlobal("BarcodeDetector", class {
    static getSupportedFormats = async () => ["qr_code"];
    detect = async () => hasilDeteksi.shift() ?? [];
  });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop }] });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  Object.defineProperty(HTMLMediaElement.prototype, "readyState", { configurable: true, get: () => 4 });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  hasilDeteksi = [];
  Reflect.deleteProperty(navigator, "mediaDevices");
  Reflect.deleteProperty(HTMLMediaElement.prototype, "readyState");
});

describe("pindai QR meja dengan kamera", () => {
  it("minta izin kamera belakang, abaikan QR lain, buka menu meja saat QR meja terbaca, lalu matikan kamera", async () => {
    const u = userEvent.setup();
    hasilDeteksi = [[], [{ rawValue: "https://contoh.com/promo" }], [{ rawValue: `https://ketringkita.edufin.app/meja/${T}` }]];
    render(<PindaiQr />);
    await u.click(screen.getByRole("button", { name: "Scan QR meja" }));

    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: { ideal: "environment" } }, audio: false });
    expect(await screen.findByText("QR ini bukan QR meja KateringKita.", {}, { timeout: 3000 })).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith(`/meja/${T}`), { timeout: 3000 });
    expect(stop).toHaveBeenCalled();
  });

  it("izin kamera ditolak → penjelasan & cara lain", async () => {
    const u = userEvent.setup();
    getUserMedia.mockRejectedValue(Object.assign(new Error("denied"), { name: "NotAllowedError" }));
    render(<PindaiQr />);
    await u.click(screen.getByRole("button", { name: "Scan QR meja" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Izin kamera ditolak");
    expect(replace).not.toHaveBeenCalled();
  });

  it("browser tanpa pemindai bawaan (mis. iPhone) → tanpa tombol, arahkan ke aplikasi kamera", () => {
    vi.stubGlobal("BarcodeDetector", undefined);
    render(<PindaiQr />);
    expect(screen.queryByRole("button", { name: "Scan QR meja" })).not.toBeInTheDocument();
    expect(screen.getByText(/aplikasi kamera HP/)).toBeInTheDocument();
  });

  it("menutup pemindai mematikan kamera", async () => {
    const u = userEvent.setup();
    render(<PindaiQr />);
    await u.click(screen.getByRole("button", { name: "Scan QR meja" }));
    await u.click(await screen.findByRole("button", { name: "Tutup kamera" }));
    expect(stop).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Scan QR meja" })).toBeInTheDocument();
  });
});
