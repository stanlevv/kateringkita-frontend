import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getMenus } from "@/lib/data/menus";
import { getPerubahan } from "@/lib/data/orders";
import { requireMerchant } from "@/lib/session";

const SEJAK = z.iso.datetime({ offset: true });
const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// M-04, D3: penyegaran antrean bertahap dashboard; token dari cookie sesi, bukan server action (tak mengantre di depan aksi).
export async function GET(req: NextRequest) {
  await requireMerchant();
  const sejak = SEJAK.safeParse(req.nextUrl.searchParams.get("sejak"));
  if (!sejak.success) return json({ error: { code: "VALIDATION_ERROR", message: "Data tidak valid." } }, 400);
  const [orders, menus] = await Promise.all([getPerubahan(sejak.data), getMenus()]);
  if ("error" in orders) return json({ error: orders.error }, 503);
  if ("error" in menus) return json({ error: menus.error }, 503);
  return json({ data: { orders: orders.data, menus: menus.data } }, 200);
}
