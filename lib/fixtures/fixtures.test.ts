// Test data contoh: bentuknya harus valid seperti data dari backend.
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { menus } from "./menus";
import { orders } from "./orders";
import { pickupPoints, categories, merchantTypes } from "./meta";
import { promoStatus } from "../promo-status";
import { promos } from "./promos";
import { reviews } from "./reviews";
import { profile } from "./profile";

const CODE_PATTERN = /^KK-\d{8}-[A-Z2-7]{4}$/;
const iso = z.string().refine((value) => !Number.isNaN(Date.parse(value)) && value.endsWith("Z"), "ISO UTC");
const rupiahAmount = z.number().int().nonnegative();
const jam = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const menuSchema = z
  .object({
    id: z.number().int(),
    name: z.string().min(1),
    price: rupiahAmount.min(1000),
    hpp: rupiahAmount,
    margin: rupiahAmount,
    quota_today: z.number().int().nonnegative(),
    sold_today: z.number().int().nonnegative(),
    held_today: z.number().int().nonnegative(),
    available: z.number().int().nonnegative(),
    category: z.object({ slug: z.string() }),
  })
  .refine((menu) => menu.price > menu.hpp, "price > hpp")
  .refine((menu) => menu.margin === menu.price - menu.hpp, "margin")
  .refine((menu) => menu.quota_today >= menu.sold_today + menu.held_today, "kuota >= terjual + ditahan")
  .refine((menu) => menu.available === menu.quota_today - menu.sold_today - menu.held_today, "available");

const orderSchema = z
  .object({
    code: z.string().regex(CODE_PATTERN),
    status: z.enum(["holding", "confirmed", "cooking", "ready", "completed", "cancelled", "expired"]),
    payment_method: z.enum(["cod", "va", "online"]),
    payment_status: z.enum(["unpaid", "pending", "paid", "failed", "refunded"]),
    items: z
      .array(z.object({ qty: z.number().int().positive(), unit_price: rupiahAmount, line_total: rupiahAmount }))
      .min(1),
    subtotal: rupiahAmount,
    discount: rupiahAmount,
    service_fee: rupiahAmount,
    total: rupiahAmount,
    customer_name: z.string().min(1),
    customer_phone: z.string().regex(/^0\d{9,12}$/),
    created_at: iso,
    updated_at: iso,
    hold_until: iso.nullable(),
    cancel_reason: z.string().nullable(),
  })
  .refine((order) => order.subtotal - order.discount + order.service_fee === order.total, "total")
  .refine((order) => order.items.reduce((sum, i) => sum + i.line_total, 0) === order.subtotal, "subtotal")
  .refine((order) => order.items.every((i) => i.line_total >= i.unit_price * i.qty), "line_total")
  .refine((order) => (order.status === "holding") === (order.hold_until !== null), "hold_until hanya untuk holding")
  .refine(
    (order) => (order.status === "cancelled" || order.status === "expired") === (order.cancel_reason !== null),
    "alasan",
  );

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
  .refine((promo) => Date.parse(promo.ends_at) > Date.parse(promo.starts_at), "rentang")
  .refine((promo) => promo.type !== "percent" || promo.value <= 100, "persen")
  .refine((promo) => promo.quota === null || promo.used_count <= promo.quota, "pemakaian");

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
  daily_revenue_target: rupiahAmount,
  pickup_point_ids: z.array(z.number().int()),
  is_open: z.boolean(),
});

describe("fixtures", () => {
  it("menu: >=12 dari 4 kategori, valid", () => {
    const menuList = menus();
    expect(menuList.length).toBeGreaterThanOrEqual(12);
    expect(new Set(menuList.map((menu) => menu.category.slug)).size).toBe(4);
    menuList.forEach((menu) => expect(menuSchema.safeParse(menu).success, menu.name).toBe(true));
    expect(new Set(menuList.map((menu) => menu.id)).size).toBe(menuList.length);
  });
  it("pesanan: >=15, semua status & metode, valid", () => {
    const orderList = orders();
    expect(orderList.length).toBeGreaterThanOrEqual(15);
    const statuses = new Set(orderList.map((order) => order.status));
    for (const status of ["holding", "confirmed", "cooking", "ready", "completed", "cancelled", "expired"])
      expect(statuses.has(status as never), status).toBe(true);
    expect(new Set(orderList.map((order) => order.payment_method)).size).toBe(3);
    orderList.forEach((order) => {
      const result = orderSchema.safeParse(order);
      expect(result.success, order.code + (result.success ? "" : JSON.stringify(result.error.issues))).toBe(true);
    });
    expect(new Set(orderList.map((order) => order.code)).size).toBe(orderList.length);
  });
  it("waktu relatif ke sekarang", () => {
    const holding = orders().find((order) => order.status === "holding")!;
    expect(Date.parse(holding.hold_until!)).toBeGreaterThan(Date.now());
  });
  it("meta seed", () => {
    expect(pickupPoints()).toHaveLength(3);
    expect(pickupPoints()[0].name).toBe("Gedung Vokasi UB (Lt. 2)");
    expect(categories()[0]).toMatchObject({ name: "Nasi Box", slug: "nasi-box" });
    expect(merchantTypes()).toHaveLength(5);
  });
  it("promo: 4 promo valid dengan 4 status berbeda", () => {
    const promoList = promos();
    expect(promoList).toHaveLength(4);
    promoList.forEach((promo) => expect(promoSchema.safeParse(promo).success, promo.code).toBe(true));
    expect(promoList.map((promo) => promoStatus(promo)).sort()).toEqual([
      "berakhir",
      "berjalan",
      "nonaktif",
      "terjadwal",
    ]);
  });
  it("ulasan: 20, rating 1..5", () => {
    const reviewList = reviews();
    expect(reviewList).toHaveLength(20);
    reviewList.forEach((review) => expect(reviewSchema.safeParse(review).success, String(review.id)).toBe(true));
    expect(new Set(reviewList.map((review) => review.id)).size).toBe(20);
  });
  it("profil valid", () => {
    expect(profileSchema.safeParse(profile()).success).toBe(true);
  });
});
