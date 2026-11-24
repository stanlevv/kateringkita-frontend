// Test pembaca token dari QR meja.
import { describe, expect, it } from "vitest";
import { tableTokenFromQr } from "./table-qr";

const TOKEN = "18239d39dcdeb7616e3c5abb87316985";

describe("tableTokenFromQr", () => {
  it("QR meja KateringKita (domain mana pun yang memakai jalur /meja/<token>)", () => {
    expect(tableTokenFromQr(`https://ketringkita.edufin.app/meja/${TOKEN}`)).toBe(TOKEN);
    expect(tableTokenFromQr(`https://ketringkita-frontend.vercel.app/meja/${TOKEN}/`)).toBe(TOKEN);
    expect(tableTokenFromQr(`  http://localhost:3000/meja/${TOKEN}?ref=x  `)).toBe(TOKEN);
  });
  it("bukan QR meja → null", () => {
    expect(tableTokenFromQr("https://ketringkita.edufin.app/menu")).toBeNull();
    expect(tableTokenFromQr(`https://ketringkita.edufin.app/meja/pesanan/KK-1`)).toBeNull();
    expect(tableTokenFromQr("halo dunia")).toBeNull();
    expect(tableTokenFromQr("javascript:alert(1)")).toBeNull();
    expect(tableTokenFromQr(`https://ketringkita.edufin.app/meja/${TOKEN}/lain`)).toBeNull();
    expect(tableTokenFromQr("https://ketringkita.edufin.app/meja/ab")).toBeNull();
  });
});
