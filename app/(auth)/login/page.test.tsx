// Test metadata halaman /login: tidak diindeks, tetapi tautannya tetap diikuti.
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/services/auth.service", () => ({ getSession: vi.fn() }));
vi.mock("@/services/meta.service", () => ({ getMaintenance: vi.fn() }));

import { metadata } from "./page";

describe("/login metadata", () => {
  it("noindex, follow", () => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
