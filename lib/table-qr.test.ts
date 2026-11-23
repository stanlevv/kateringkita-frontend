import { describe, expect, it } from "vitest";
import { tokenDariQr } from "./meja-qr";

const T = "18239d39dcdeb7616e3c5abb87316985";

describe("tokenDariQr", () => {
  it("QR meja KateringKita (domain mana pun yang memakai jalur /meja/<token>)", () => {
    expect(tokenDariQr(`https://ketringkita.edufin.app/meja/${T}`)).toBe(T);
    expect(tokenDariQr(`https://ketringkita-frontend.vercel.app/meja/${T}/`)).toBe(T);
    expect(tokenDariQr(`  http://localhost:3000/meja/${T}?ref=x  `)).toBe(T);
  });
  it("bukan QR meja → null", () => {
    expect(tokenDariQr("https://ketringkita.edufin.app/menu")).toBeNull();
    expect(tokenDariQr(`https://ketringkita.edufin.app/meja/pesanan/KK-1`)).toBeNull();
    expect(tokenDariQr("halo dunia")).toBeNull();
    expect(tokenDariQr("javascript:alert(1)")).toBeNull();
    expect(tokenDariQr(`https://ketringkita.edufin.app/meja/${T}/lain`)).toBeNull();
    expect(tokenDariQr("https://ketringkita.edufin.app/meja/ab")).toBeNull();
  });
});
