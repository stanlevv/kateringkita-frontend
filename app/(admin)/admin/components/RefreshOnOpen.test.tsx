// Test RefreshOnOpen: router.refresh() dipanggil tepat sekali walau komponen dirender ulang.
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const router = { refresh };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
import { RefreshOnOpen } from "./RefreshOnOpen";

describe("RefreshOnOpen", () => {
  it("memuat ulang data server sekali saat tampil", () => {
    const { rerender } = render(<RefreshOnOpen />);
    rerender(<RefreshOnOpen />);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
