// Test route handler /api/* tanpa cookie sesi, memakai services/auth.service.ts yang asli (hanya cookies dan redirect
// yang dipalsukan): sinkron, wa, chat, dan chat belum dibaca dialihkan ke /login?alasan=sesi-habis, unduhan CSV dijawab 401 JSON.
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// services/auth.service.ts asli, tanpa cookie: proxy.ts tidak mencakup /api, jadi tiap handler menjaga dirinya sendiri.
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
import { GET as syncRoute } from "@/app/api/dashboard/sinkron/route";
import { GET as reportCsvRoute } from "@/app/api/laporan/csv/route";
import { GET as whatsappRoute } from "@/app/api/pesanan/[code]/wa/route";
import { GET as chatRoute } from "@/app/api/pesanan/[code]/chat/route";
import { GET as unreadChatsRoute } from "@/app/api/chat/belum-dibaca/route";

describe("Route Handler /api/* tanpa cookie sesi", () => {
  it("sinkron -> redirect ke /login?alasan=sesi-habis", async () => {
    await expect(
      syncRoute(new NextRequest("http://localhost/api/dashboard/sinkron?sejak=2026-11-01T03:00:00.000Z")),
    ).rejects.toThrow("REDIRECT:/login?alasan=sesi-habis");
  });
  it("wa -> redirect ke /login?alasan=sesi-habis", async () => {
    await expect(
      whatsappRoute(new Request("http://localhost/api/pesanan/KK-1/wa"), { params: Promise.resolve({ code: "KK-1" }) }),
    ).rejects.toThrow("REDIRECT:/login?alasan=sesi-habis");
  });
  it("chat -> redirect ke /login?alasan=sesi-habis", async () => {
    await expect(
      chatRoute(new NextRequest("http://localhost/api/pesanan/KK-1/chat?after_id=3"), {
        params: Promise.resolve({ code: "KK-1" }),
      }),
    ).rejects.toThrow("REDIRECT:/login?alasan=sesi-habis");
  });
  it("chat belum dibaca -> redirect ke /login?alasan=sesi-habis", async () => {
    await expect(unreadChatsRoute()).rejects.toThrow("REDIRECT:/login?alasan=sesi-habis");
  });
  it("csv -> 401 JSON", async () => {
    const response = await reportCsvRoute(
      new Request("http://localhost/api/laporan/csv?dari=2026-10-25&sampai=2026-10-31"),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Sesi berakhir. Masuk lagi untuk mengunduh." });
  });
});
