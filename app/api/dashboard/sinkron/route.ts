import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getMenus } from "@/services/menu.service";
import { getChangedOrders } from "@/services/order.service";
import { requireMerchant } from "@/services/auth.service";

const SINCE_SCHEMA = z.iso.datetime({ offset: true });
const jsonResponse = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// M-04, D3: penyegaran antrean bertahap dashboard; token dari cookie sesi, bukan server action (tak mengantre di depan aksi).
export async function GET(request: NextRequest) {
  await requireMerchant();
  const since = SINCE_SCHEMA.safeParse(request.nextUrl.searchParams.get("sejak"));
  if (!since.success) return jsonResponse({ error: { code: "VALIDATION_ERROR", message: "Data tidak valid." } }, 400);
  const [orders, menus] = await Promise.all([getChangedOrders(since.data), getMenus()]);
  if ("error" in orders) return jsonResponse({ error: orders.error }, 503);
  if ("error" in menus) return jsonResponse({ error: menus.error }, 503);
  return jsonResponse({ data: { orders: orders.data, menus: menus.data } }, 200);
}
