import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock("./QrScanner", () => ({ QrScanner: () => <button type="button">Scan QR meja</button> }));

import { LastTable } from "./LastTable";

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("/meja", () => {
  it("belum pernah scan → petunjuk + tombol scan QR", () => {
    window.history.replaceState(null, "", "/meja");
    render(<LastTable />);
    expect(screen.getByRole("heading", { name: "Scan QR di meja" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scan QR meja" })).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("pernah scan → langsung ke meja terakhir", () => {
    window.history.replaceState(null, "", "/meja");
    localStorage.setItem("kk-meja-terakhir", JSON.stringify("tokenlama1234567890"));
    render(<LastTable />);
    expect(replace).toHaveBeenCalledWith("/meja/tokenlama1234567890");
  });

  it("?pindai=1 (pindah meja) → tetap di pemindai walau pernah scan", () => {
    window.history.replaceState(null, "", "/meja?pindai=1");
    localStorage.setItem("kk-meja-terakhir", JSON.stringify("tokenlama1234567890"));
    render(<LastTable />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Scan QR meja" })).toBeInTheDocument();
  });
});
