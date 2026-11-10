import { describe, expect, it } from "vitest";
import { z } from "zod";
import { menus } from "./menus";
import { orders } from "./orders";
import { pickupPoints, categories, merchantTypes } from "./meta";
import { promoStatus } from "../promo-status";
import { promos } from "./promos";
import { reviews } from "./reviews";
import { profile } from "./profile";

const KODE = /^KK-\d{8}-[A-Z2-7]{4}$/;
const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)) && s.endsWith("Z"), "ISO UTC");
const rupiah = z.number().int().nonnegative();
const jam = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const menuSchema = z
  .object({
    id: z.number().int(),
    name: z.string().min(1),
    price: rupiah.min(1000),
    hpp: rupiah,
    margin: rupiah,
    quota_today: z.number().int().nonnegative(),
    sold_today: z.number().int().nonnegative(),
    held_today: z.number().int().nonnegative(),
    available: z.number().int().nonnegative(),
    category: z.object({ slug: z.string() }),
  })
  .refine((m) => m.price > m.hpp, "price > hpp")
  .refine((m) => m.margin === m.price - m.hpp, "margin")
  .refine((m) => m.quota_today >= m.sold_today + m.held_today, "kuota >= terjual + ditahan")
  .refine((m) => m.available === m.quota_today - m.sold_today - m.held_today, "available");

const orderSchema = z
  .object({
    code: z.string().regex(KODE),
    status: z.enum(["holding", "confirmed", "cooking", "ready", "completed", "cancelled", "expired"]),
    payment_method: z.enum(["cod", "va", "online"]),
    payment_status: z.enum(["unpaid", "pending", "paid", "failed", "refunded"]),
    items: z
      .array(z.object({ qty: z.number().int().positive(), unit_price: rupiah, line_total: rupiah }))
      .min(1),
    subtotal: rupiah,
    discount: rupiah,
    service_fee: rupiah,
    total: rupiah,
    customer_name: z.string().min(1),
    customer_phone: z.string().regex(/^0\d{9,12}$/),
    created_at: iso,
    updated_at: iso,
    hold_until: iso.nullable(),
    cancel_reason: z.string().nullable(),
  })
  .refine((o) => o.subtotal - o.discount + o.service_fee === o.total, "total")
  .refine((o) => o.items.reduce((s, i) => s + i.line_total, 0) === o.subtotal, "subtotal")
  .refine((o) => o.items.every((i) => i.line_total >= i.unit_price * i.qty), "line_total")
  .refine((o) => (o.status === "holding") === (o.hold_until !== null), "hold_until hanya untuk holding")
  .refine((o) => (o.status === "cancelled" || o.status === "expired") === (o.cancel_reason !== null), "alasan");

const promoSchema = z
  .object({
    id: z.number().int(),
    code: z.string().regex(/^[A-Z0-9]+$/),
    type: z.enum(["percent", "fixed", "free_service_fee"]),
    value: z.number().int().nonnegative(),
    quota: z.number().int().positive().nullable(),
    used_count: z.number().int().nonnegative(),
    starts_at: iso,
    ends_at: iso,
    is_active: z.boolean(),
  })
  .refine((p) => Date.parse(p.ends_at) > Date.parse(p.starts_at), "rentang")
  .refine((p) => p.type !== "percent" || p.value <= 100, "persen")
  .refine((p) => p.quota === null || p.used_count <= p.quota, "pemakaian");

const reviewSchema = z.object({
  id: z.number().int(),
  menu_id: z.number().int(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  created_at: iso,
});

const profileSchema = z.object({
  business_name: z.string().min(1),
  address: z.string().min(1),
  service_mode: z.enum(["daily", "event", "both"]),
  wa_number: z.string().regex(/^08\d{8,11}$/),
  open_time: jam,
  close_time: jam,
  hold_minutes: z.number().int().min(1).max(30),
  daily_revenue_target: rupiah,
  pickup_point_ids: z.array(z.number().int()),
  is_open: z.boolean(),
});

describe("fixtures", () => {
  it("menu: >=12 dari 4 kategori, valid", () => {
    const ms = menus();
    expect(ms.length).toBeGreaterThanOrEqual(12);
    expect(new Set(ms.map((m) => m.category.slug)).size).toBe(4);
    ms.forEach((m) => expect(menuSchema.safeParse(m).success, m.name).toBe(true));
    expect(new Set(ms.map((m) => m.id)).size).toBe(ms.length);
  });
  it("pesanan: >=15, semua status & metode, valid", () => {
    const os = orders();
    expect(os.length).toBeGreaterThanOrEqual(15);
    const st = new Set(os.map((o) => o.status));
    for (const s of ["holding", "confirmed", "cooking", "ready", "completed", "cancelled", "expired"]) expect(st.has(s as never), s).toBe(true);
    expect(new Set(os.map((o) => o.payment_method)).size).toBe(3);
    os.forEach((o) => {
      const r = orderSchema.safeParse(o);
      expect(r.success, o.code + (r.success ? "" : JSON.stringify(r.error.issues))).toBe(true);
    });
    expect(new Set(os.map((o) => o.code)).size).toBe(os.length);
  });
  it("waktu relatif ke sekarang", () => {
    const h = orders().find((o) => o.status === "holding")!;
    expect(Date.parse(h.hold_until!)).toBeGreaterThan(Date.now());
  });
  it("meta seed", () => {
    expect(pickupPoints()).toHaveLength(3);
    expect(pickupPoints()[0].name).toBe("Gedung Vokasi UB (Lt. 2)");
    expect(categories()[0]).toMatchObject({ name: "Nasi Box", slug: "nasi-box" });
    expect(merchantTypes()).toHaveLength(5);
  });
  it("promo: 4 promo valid dengan 4 status berbeda", () => {
    const ps = promos();
    expect(ps).toHaveLength(4);
    ps.forEach((p) => expect(promoSchema.safeParse(p).success, p.code).toBe(true));
    expect(ps.map((p) => promoStatus(p)).sort()).toEqual(["berakhir", "berjalan", "nonaktif", "terjadwal"]);
  });
  it("ulasan: 20, rating 1..5", () => {
    const rs = reviews();
    expect(rs).toHaveLength(20);
    rs.forEach((r) => expect(reviewSchema.safeParse(r).success, String(r.id)).toBe(true));
    expect(new Set(rs.map((r) => r.id)).size).toBe(20);
  });
  it("profil valid", () => {
    expect(profileSchema.safeParse(profile()).success).toBe(true);
  });
});
