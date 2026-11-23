// Test callAction: galat jaringan dari server action diubah menjadi hasil galat biasa.
import { describe, expect, it } from "vitest";
import { callAction } from "./action";

describe("panggil", () => {
  it("meneruskan hasil aksi apa adanya", async () => {
    expect(await callAction(async () => ({ data: 1 }))).toEqual({ data: 1 });
    expect(await callAction(async () => ({ error: { code: "X", message: "y" } }))).toEqual({
      error: { code: "X", message: "y" },
    });
  });

  it("aksi melempar (jaringan putus) -> galat NETWORK, bukan exception", async () => {
    expect(await callAction(() => Promise.reject(new Error("Failed to fetch")))).toEqual({
      error: { code: "NETWORK", message: "Server tidak dapat dihubungi. Coba lagi." },
    });
  });
});
