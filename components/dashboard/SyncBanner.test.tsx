import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SyncBanner } from "./SyncBanner";

describe("DB-E5 banner koneksi terputus", () => {
  it("menyebut jam sinkron sukses terakhir", () => {
    render(<SyncBanner terakhir={Date.parse("2026-10-31T04:42:00Z")} />);
    expect(screen.getByText("Koneksi terputus — data terakhir 11.42. Mencoba lagi…")).toBeInTheDocument();
  });
});
