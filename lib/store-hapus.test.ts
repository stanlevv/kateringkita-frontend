import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("FE-01/FE-11 store contoh dihapus", () => {
  it("lib/store.tsx tidak ada dan layout tidak memakai StoreProvider", () => {
    expect(existsSync(join(__dirname, "store.tsx"))).toBe(false);
    const layout = readFileSync(join(__dirname, "../app/(dashboard)/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/\bStoreProvider\b/);
    expect(layout).not.toContain("@/lib/store");
  });
  it("copilot tidak memakai store lama", () => {
    const c = readFileSync(join(__dirname, "../app/(dashboard)/copilot/page.tsx"), "utf8");
    expect(c).not.toContain("lib/store");
    expect(c).not.toContain("useStore");
  });
});
