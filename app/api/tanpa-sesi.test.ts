import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// authService asli, tanpa cookie: proxy.ts tidak mencakup /api, jadi tiap handler menjaga dirinya sendiri.
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/navigation", () => ({
  redirect: (u: string) => { throw new Error(`REDIRECT:${u}`); },
  notFound: () => { throw new Error("NOT_FOUND"); },
}));
import { GET as sinkron } from "@/app/api/dashboard/sinkron/route";
import { GET as csv } from "@/app/api/laporan/csv/route";
import { GET as wa } from "@/app/api/pesanan/[code]/wa/route";

describe("Route Handler /api/* tanpa cookie sesi", () => {
  it("sinkron -> redirect ke /login?alasan=sesi-habis", async () => {
    await expect(sinkron(new NextRequest("http://localhost/api/dashboard/sinkron?sejak=2026-11-01T03:00:00.000Z"))).rejects.toThrow("REDIRECT:/login?alasan=sesi-habis");
  });
  it("wa -> redirect ke /login?alasan=sesi-habis", async () => {
    await expect(wa(new Request("http://localhost/api/pesanan/KK-1/wa"), { params: Promise.resolve({ code: "KK-1" }) })).rejects.toThrow("REDIRECT:/login?alasan=sesi-habis");
  });
  it("csv -> 401 JSON", async () => {
    const res = await csv(new Request("http://localhost/api/laporan/csv?dari=2026-10-25&sampai=2026-10-31"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Sesi berakhir. Masuk lagi untuk mengunduh." });
  });
});
