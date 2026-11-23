// Data contoh pesanan untuk test: semua status dan cara bayar, dengan waktu relatif terhadap sekarang.

import type { MerchantOrder, OrderStatus, PaymentMethod, PaymentStatus } from "@/types/order";
import { menus } from "./menus";
import { pickupPoints } from "./meta";
import { minutesFromNow, minutesAgo } from "./time";

type Spec = {
  code: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: [menuId: number, qty: number, optionIndex?: number][];
  ageMinutes: number; // menit sejak dibuat
  customerName: string;
  phone: string;
  pickupPointId?: number;
  note?: string;
  pickupInMinutes?: number; // menit dari sekarang; kosong = secepatnya
  cancelReason?: string;
  cancelledBy?: MerchantOrder["cancelled_by"];
};

const CODE_PREFIX = "KK-20261031-";

const SPEC: Spec[] = [
  {
    code: `${CODE_PREFIX}7QF2`,
    status: "holding",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    items: [
      [1, 2, 0],
      [7, 1],
    ],
    ageMinutes: 1,
    customerName: "Rafli Ramadhan",
    phone: "081234567890",
    note: "Sambal dipisah, sendok 3 pcs",
  },
  {
    code: `${CODE_PREFIX}K3MA`,
    status: "holding",
    paymentMethod: "va",
    paymentStatus: "unpaid",
    items: [[5, 1]],
    ageMinutes: 2,
    customerName: "Salsa Putri",
    phone: "082233445566",
    pickupPointId: 2,
  },
  {
    code: `${CODE_PREFIX}B4NZ`,
    status: "holding",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    items: [[10, 3]],
    ageMinutes: 3,
    customerName: "Dimas Prakoso",
    phone: "085711223344",
    pickupPointId: 3,
    pickupInMinutes: 45,
  },
  {
    code: `${CODE_PREFIX}C5RW`,
    status: "confirmed",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    items: [
      [3, 2],
      [11, 2],
    ],
    ageMinutes: 12,
    customerName: "Nadia Kusuma",
    phone: "081355667788",
  },
  {
    code: `${CODE_PREFIX}D6TY`,
    status: "confirmed",
    paymentMethod: "online",
    paymentStatus: "paid",
    items: [[2, 4]],
    ageMinutes: 15,
    customerName: "Bagas Wicaksono",
    phone: "087812341234",
    pickupInMinutes: 60,
  },
  {
    code: `${CODE_PREFIX}E2HV`,
    status: "cooking",
    paymentMethod: "va",
    paymentStatus: "paid",
    items: [
      [6, 3],
      [12, 3],
    ],
    ageMinutes: 25,
    customerName: "Intan Permata",
    phone: "081911223355",
    pickupPointId: 2,
  },
  {
    code: `${CODE_PREFIX}F7JK`,
    status: "cooking",
    paymentMethod: "online",
    paymentStatus: "paid",
    items: [
      [1, 1],
      [8, 2],
    ],
    ageMinutes: 32,
    customerName: "Yoga Pratama",
    phone: "089612345678",
  },
  {
    code: `${CODE_PREFIX}G3LM`,
    status: "ready",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    items: [[5, 2]],
    ageMinutes: 50,
    customerName: "Citra Anjani",
    phone: "081298765432",
    pickupPointId: 3,
  },
  {
    code: `${CODE_PREFIX}H4PQ`,
    status: "ready",
    paymentMethod: "va",
    paymentStatus: "paid",
    items: [
      [4, 1],
      [10, 1],
    ],
    ageMinutes: 55,
    customerName: "Fajar Nugroho",
    phone: "082144556677",
  },
  {
    code: `${CODE_PREFIX}J5SD`,
    status: "completed",
    paymentMethod: "cod",
    paymentStatus: "paid",
    items: [[1, 3]],
    ageMinutes: 120,
    customerName: "Laras Setiawati",
    phone: "081377889900",
  },
  {
    code: `${CODE_PREFIX}L6TF`,
    status: "completed",
    paymentMethod: "online",
    paymentStatus: "paid",
    items: [
      [7, 4],
      [10, 4],
    ],
    ageMinutes: 180,
    customerName: "Reza Maulana",
    phone: "085233221100",
    pickupPointId: 2,
  },
  {
    code: `${CODE_PREFIX}M7UG`,
    status: "completed",
    paymentMethod: "va",
    paymentStatus: "paid",
    items: [[3, 2]],
    ageMinutes: 240,
    customerName: "Putri Handayani",
    phone: "081566778899",
  },
  {
    code: `${CODE_PREFIX}N2VH`,
    status: "cancelled",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    items: [[2, 1]],
    ageMinutes: 90,
    customerName: "Hendra Gunawan",
    phone: "087755443322",
    cancelReason: "Stok habis",
    cancelledBy: "merchant",
  },
  {
    code: `${CODE_PREFIX}P3WJ`,
    status: "cancelled",
    paymentMethod: "online",
    paymentStatus: "refunded",
    items: [[5, 2]],
    ageMinutes: 150,
    customerName: "Winda Lestari",
    phone: "082199887766",
    cancelReason: "Dibatalkan pembeli",
    cancelledBy: "customer",
  },
  {
    code: `${CODE_PREFIX}Q4XK`,
    status: "expired",
    paymentMethod: "va",
    paymentStatus: "unpaid",
    items: [[11, 1]],
    ageMinutes: 200,
    customerName: "Aldi Firmansyah",
    phone: "081244332211",
    cancelReason: "Batas waktu bayar habis",
    cancelledBy: "system",
  },
  {
    code: `${CODE_PREFIX}R5YL`,
    status: "expired",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    items: [[1, 1]],
    ageMinutes: 300,
    customerName: "Mega Sari",
    phone: "089955667788",
    cancelReason: "Tidak dikonfirmasi tepat waktu",
    cancelledBy: "system",
  },
];

function buildOrder(spec: Spec): MerchantOrder {
  const menuList = menus();
  const pickupPoint = pickupPoints().find((point) => point.id === (spec.pickupPointId ?? 1))!;
  const items = spec.items.map(([id, qty, optionIndex]) => {
    const menu = menuList.find((candidate) => candidate.id === id)!;
    const options = optionIndex === undefined ? [] : [menu.options[optionIndex]];
    const unit = menu.price + options.reduce((sum, option) => sum + option.extra_price, 0);
    return { menu_id: id, menu_name: menu.name, qty, unit_price: unit, options, line_total: unit * qty };
  });
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const createdAt = minutesAgo(spec.ageMinutes);
  const afterMinutes = (minutes: number) => minutesAgo(Math.max(0, spec.ageMinutes - minutes));
  const isPastConfirmation = ["confirmed", "cooking", "ready", "completed"].includes(spec.status);
  const holding = spec.status === "holding";
  return {
    code: spec.code,
    status: spec.status,
    payment_method: spec.paymentMethod,
    payment_status: spec.paymentStatus,
    hold_until: holding ? minutesFromNow(5 - spec.ageMinutes) : null,
    seconds_left: holding ? Math.round((5 - spec.ageMinutes) * 60) : null,
    pickup_point: pickupPoint,
    table: null,
    pickup_at: spec.pickupInMinutes ? minutesFromNow(spec.pickupInMinutes) : null,
    items,
    subtotal,
    discount: 0,
    service_fee: 0,
    total: subtotal,
    note: spec.note ?? null,
    customer_name: spec.customerName,
    customer_phone: spec.phone,
    cancel_reason: spec.cancelReason ?? null,
    cancelled_by: spec.cancelledBy ?? null,
    created_at: createdAt,
    updated_at: afterMinutes(1),
    confirmed_at: isPastConfirmation ? afterMinutes(1) : null,
    cooking_at: ["cooking", "ready", "completed"].includes(spec.status) ? afterMinutes(5) : null,
    ready_at: ["ready", "completed"].includes(spec.status) ? afterMinutes(25) : null,
    completed_at: spec.status === "completed" ? afterMinutes(40) : null,
    cancelled_at: spec.cancelReason ? afterMinutes(1) : null,
  };
}

/** Membuat daftar pesanan contoh. */
export const orders = (): MerchantOrder[] => SPEC.map(buildOrder);

/** Membuat satu pesanan tambahan yang masuk tepat saat ini (dipakai skenario "pesanan-baru"). */
export const newOrder = (): MerchantOrder =>
  buildOrder({
    code: `${CODE_PREFIX}S6ZA`,
    status: "holding",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    items: [
      [6, 2],
      [10, 2],
    ],
    ageMinutes: 0,
    customerName: "Tegar Wibowo",
    phone: "081322110099",
    note: "Es teh tanpa gula",
  });
