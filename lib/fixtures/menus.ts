import type { MerchantMenu } from "@/types/menu";
import { categories } from "./meta";

type Baris = [id: number, name: string, cat: number, unit: string, price: number, hpp: number, kuota: number, terjual: number, ditahan: number, opts?: string[]];

const BARIS: Baris[] = [
  [1, "Nasi Ayam Bakar Madu", 1, "1 box", 22000, 14000, 40, 22, 3, ["Sambal pisah", "Tambah telur"]],
  [2, "Nasi Box Rendang", 1, "1 box", 25000, 16500, 30, 30, 0],
  [3, "Nasi Liwet Komplit", 1, "1 box", 24000, 15000, 25, 18, 4],
  [4, "Nasi Kuning Ayam Suwir", 1, "1 box", 20000, 12500, 20, 5, 0],
  [5, "Ayam Geprek Level 3", 2, "1 porsi", 18000, 10500, 35, 31, 2, ["Level pedas 5"]],
  [6, "Ayam Goreng Kremes", 2, "2 potong", 19000, 11500, 30, 12, 1],
  [7, "Risol Mayo Lumer", 4, "isi 3", 12000, 6500, 50, 20, 2, ["Tambah saus"]],
  [8, "Brownies Kukus", 4, "1 potong", 8000, 4000, 40, 40, 0],
  [9, "Lumpia Basah", 4, "isi 5", 15000, 8000, 30, 8, 0],
  [10, "Es Teh Manis Jumbo", 5, "500 ml", 6000, 2000, 80, 45, 5, ["Less sugar"]],
  [11, "Kopi Susu Gula Aren", 5, "350 ml", 14000, 7000, 40, 38, 1],
  [12, "Es Jeruk Peras", 5, "400 ml", 9000, 4500, 30, 3, 0],
];

export const menus = (): MerchantMenu[] => {
  const cat = categories();
  return BARIS.map(([id, name, c, unit, price, hpp, kuota, terjual, ditahan, opts = []]) => ({
    id,
    name,
    description: `${name} buatan dapur sendiri, dibuat segar setiap hari.`,
    image_url: null,
    category: cat.find((x) => x.id === c)!,
    unit_label: unit,
    price,
    hpp,
    margin: price - hpp,
    daily_quota: kuota,
    quota_today: kuota,
    sold_today: terjual,
    held_today: ditahan,
    available: kuota - terjual - ditahan,
    prep_minutes: c === 5 ? 5 : 20,
    is_preorder: false,
    preorder_days: 0,
    min_order_qty: 1,
    is_active: id !== 9,
    options: opts.map((n, i) => ({ id: id * 10 + i, name: n, extra_price: n.startsWith("Tambah") ? 3000 : 0 })),
    rating_avg: 4 + (id % 10) / 10,
    rating_count: 10 + id * 7,
  }));
};
