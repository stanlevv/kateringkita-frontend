import { describe, expect, it } from "vitest";
import { panggil } from "./aksi";

describe("panggil", () => {
  it("meneruskan hasil aksi apa adanya", async () => {
    expect(await panggil(async () => ({ data: 1 }))).toEqual({ data: 1 });
    expect(await panggil(async () => ({ error: { code: "X", message: "y" } }))).toEqual({ error: { code: "X", message: "y" } });
  });

  it("aksi melempar (jaringan putus) -> galat NETWORK, bukan exception", async () => {
    expect(await panggil(() => Promise.reject(new Error("Failed to fetch")))).toEqual({
      error: { code: "NETWORK", message: "Server tidak dapat dihubungi. Coba lagi." },
    });
  });
});
