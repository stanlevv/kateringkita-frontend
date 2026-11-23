// Test ringkasan isi pesanan di daftar pesanan.
import { describe, expect, it } from "vitest";
import { summarizeItems } from "./order-filter";

describe("ringkasItem", () => {
  it("satu item", () => expect(summarizeItems({ items: [{ qty: 3, menu_name: "Es Teh" }] })).toBe("3× Es Teh"));
  it("lebih dari satu: +N lainnya", () => {
    expect(
      summarizeItems({
        items: [
          { qty: 2, menu_name: "Nasi" },
          { qty: 1, menu_name: "A" },
          { qty: 1, menu_name: "B" },
        ],
      }),
    ).toBe("2× Nasi, +2 lainnya");
  });
});
