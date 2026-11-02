import type { MerchantOrder, OrderStatus, PaymentMethod, PaymentStatus } from "../types";
import { menus } from "./menus";
import { pickupPoints } from "./meta";
import { menitLagi, menitLalu } from "./waktu";

type Spec = {
  code: string;
  status: OrderStatus;
  method: PaymentMethod;
  pay: PaymentStatus;
  items: [menuId: number, qty: number, opt?: number][];
  umur: number; // menit sejak dibuat
  nama: string;
  telp: string;
  titik?: number;
  note?: string;
  pickup?: number; // menit dari sekarang; kosong = secepatnya
  alasan?: string;
  oleh?: MerchantOrder["cancelled_by"];
};

const D = "KK-20261031-";

const SPEC: Spec[] = [
  { code: `${D}7QF2`, status: "holding", method: "cod", pay: "unpaid", items: [[1, 2, 0], [7, 1]], umur: 1, nama: "Rafli Ramadhan", telp: "081234567890", note: "Sambal dipisah, sendok 3 pcs" },
  { code: `${D}K3MA`, status: "holding", method: "qris", pay: "unpaid", items: [[5, 1]], umur: 2, nama: "Salsa Putri", telp: "082233445566", titik: 2 },
  { code: `${D}B4NZ`, status: "holding", method: "cod", pay: "unpaid", items: [[10, 3]], umur: 3, nama: "Dimas Prakoso", telp: "085711223344", titik: 3, pickup: 45 },
  { code: `${D}C5RW`, status: "confirmed", method: "cod", pay: "unpaid", items: [[3, 2], [11, 2]], umur: 12, nama: "Nadia Kusuma", telp: "081355667788" },
  { code: `${D}D6TY`, status: "confirmed", method: "qris", pay: "paid", items: [[2, 4]], umur: 15, nama: "Bagas Wicaksono", telp: "087812341234", pickup: 60 },
  { code: `${D}E2HV`, status: "cooking", method: "va", pay: "paid", items: [[6, 3], [12, 3]], umur: 25, nama: "Intan Permata", telp: "081911223355", titik: 2 },
  { code: `${D}F7JK`, status: "cooking", method: "qris", pay: "paid", items: [[1, 1], [8, 2]], umur: 32, nama: "Yoga Pratama", telp: "089612345678" },
  { code: `${D}G3LM`, status: "ready", method: "cod", pay: "unpaid", items: [[5, 2]], umur: 50, nama: "Citra Anjani", telp: "081298765432", titik: 3 },
  { code: `${D}H4PQ`, status: "ready", method: "qris", pay: "paid", items: [[4, 1], [10, 1]], umur: 55, nama: "Fajar Nugroho", telp: "082144556677" },
  { code: `${D}J5SD`, status: "completed", method: "cod", pay: "paid", items: [[1, 3]], umur: 120, nama: "Laras Setiawati", telp: "081377889900" },
  { code: `${D}L6TF`, status: "completed", method: "qris", pay: "paid", items: [[7, 4], [10, 4]], umur: 180, nama: "Reza Maulana", telp: "085233221100", titik: 2 },
  { code: `${D}M7UG`, status: "completed", method: "va", pay: "paid", items: [[3, 2]], umur: 240, nama: "Putri Handayani", telp: "081566778899" },
  { code: `${D}N2VH`, status: "cancelled", method: "cod", pay: "unpaid", items: [[2, 1]], umur: 90, nama: "Hendra Gunawan", telp: "087755443322", alasan: "Stok habis", oleh: "merchant" },
  { code: `${D}P3WJ`, status: "cancelled", method: "qris", pay: "refunded", items: [[5, 2]], umur: 150, nama: "Winda Lestari", telp: "082199887766", alasan: "Dibatalkan pembeli", oleh: "customer" },
  { code: `${D}Q4XK`, status: "expired", method: "qris", pay: "expired", items: [[11, 1]], umur: 200, nama: "Aldi Firmansyah", telp: "081244332211", alasan: "Batas waktu bayar habis", oleh: "system" },
  { code: `${D}R5YL`, status: "expired", method: "cod", pay: "unpaid", items: [[1, 1]], umur: 300, nama: "Mega Sari", telp: "089955667788", alasan: "Tidak dikonfirmasi tepat waktu", oleh: "system" },
];

function bangun(s: Spec): MerchantOrder {
  const katalog = menus();
  const titik = pickupPoints().find((p) => p.id === (s.titik ?? 1))!;
  const items = s.items.map(([id, qty, opt]) => {
    const m = katalog.find((x) => x.id === id)!;
    const options = opt === undefined ? [] : [m.options[opt]];
    const unit = m.price + options.reduce((a, o) => a + o.extra_price, 0);
    return { menu_id: id, menu_name: m.name, qty, unit_price: unit, options, line_total: unit * qty };
  });
  const subtotal = items.reduce((a, i) => a + i.line_total, 0);
  const dibuat = menitLalu(s.umur);
  const sejak = (menit: number) => menitLalu(Math.max(0, s.umur - menit));
  const lewatKonfirmasi = ["confirmed", "cooking", "ready", "completed"].includes(s.status);
  const holding = s.status === "holding";
  return {
    code: s.code,
    status: s.status,
    payment_method: s.method,
    payment_status: s.pay,
    hold_until: holding ? menitLagi(5 - s.umur) : null,
    seconds_left: holding ? Math.round((5 - s.umur) * 60) : null,
    pickup_point: titik,
    pickup_at: s.pickup ? menitLagi(s.pickup) : null,
    items,
    subtotal,
    discount: 0,
    service_fee: 0,
    total: subtotal,
    note: s.note ?? null,
    customer_name: s.nama,
    customer_phone: s.telp,
    cancel_reason: s.alasan ?? null,
    cancelled_by: s.oleh ?? null,
    created_at: dibuat,
    updated_at: sejak(1),
    confirmed_at: lewatKonfirmasi ? sejak(1) : null,
    cooking_at: ["cooking", "ready", "completed"].includes(s.status) ? sejak(5) : null,
    ready_at: ["ready", "completed"].includes(s.status) ? sejak(25) : null,
    completed_at: s.status === "completed" ? sejak(40) : null,
    cancelled_at: s.alasan ? sejak(1) : null,
  };
}

export const orders = (): MerchantOrder[] => SPEC.map(bangun);

/** Pesanan tambahan untuk skenario "pesanan-baru": masuk tepat saat ini. */
export const pesananBaru = (): MerchantOrder =>
  bangun({ code: `${D}S6ZA`, status: "holding", method: "cod", pay: "unpaid", items: [[6, 2], [10, 2]], umur: 0, nama: "Tegar Wibowo", telp: "081322110099", note: "Es teh tanpa gula" });
