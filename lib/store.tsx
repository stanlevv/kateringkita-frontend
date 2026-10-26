"use client";
import { createContext, useContext, useEffect, useState } from "react";
export const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");
export type Menu = { id: number; name: string; cat: string; price: number; hpp: number; stock: number; hold: number; sold: number; est: string; img: string; isOptimistic?: boolean };
export type Order = {
  id: string;
  name: string;
  phone: string;
  items: string[];
  total: number;
  loc: string;
  note?: string;
  status: "holding" | "masak" | "selesai" | "batal";
  time: string;
  left: number;
};
const m0: Menu[] = [
  { id: 1, name: "Nasi Ayam Bakar Madu Komplit", cat: "Nasi Box", price: 18000, hpp: 12000, stock: 6, hold: 2, sold: 42, est: "15 Mnt", img: "/menu/1.png" },
  { id: 2, name: "Risol Mayo Lumer (Isi 3)", cat: "Snack", price: 10000, hpp: 6500, stock: 2, hold: 1, sold: 27, est: "10 Mnt", img: "/menu/2.png" },
  { id: 3, name: "Es Teh Solo Jumbo 22oz", cat: "Minuman", price: 5000, hpp: 2000, stock: 25, hold: 0, sold: 32, est: "5 Mnt", img: "/menu/3.png" },
  { id: 4, name: "Nasi Bento Katsu Sambal Bawang", cat: "Nasi Box", price: 16000, hpp: 10500, stock: 0, hold: 0, sold: 15, est: "15 Mnt", img: "/menu/4.png" },
  { id: 5, name: "Paket Bento & Prasmanan Acara (Seminar/Makrab)", cat: "Paket Custom", price: 25000, hpp: 16000, stock: 150, hold: 0, sold: 80, est: "Pre-Order H-2", img: "/menu/5.png" },
];
const o0: Order[] = [
  {
    id: "#KK-20260918-98F1",
    name: "Rafli Ramadhan",
    phone: "0812-3456-7890",
    items: ["2× Nasi Ayam Bakar Madu", "1× Risol Mayo Lumer"],
    total: 46000,
    loc: "Gedung Vokasi Lt. 2 (R. 2.04)",
    note: "Sambal dipisah, sendok 3 pcs",
    status: "holding",
    time: "11:42",
    left: 220,
  },
  {
    id: "#KK-20260918-88A2",
    name: "Siti Aisyah (BEM Vokasi)",
    phone: "0857-9988-1122",
    items: ["30× Paket Bento Acara"],
    total: 750000,
    loc: "Sekretariat BEM Vokasi",
    status: "masak",
    time: "11:35",
    left: 0,
  },
  { id: "#KK-20260918-77C9", name: "Budi Santoso", phone: "0813-1111-2222", items: ["3× Es Teh Solo Jumbo"], total: 15000, loc: "Kantin Vokasi", status: "selesai", time: "11:15", left: 0 },
];
type Ctx = {
  menu: Menu[];
  setMenu: (m: Menu[]) => void;
  orders: Order[];
  on: boolean;
  setOn: (b: boolean) => void;
  adj: (id: number, d: number) => void;
  setStatus: (id: string, s: Order["status"]) => void;
  addOrder: () => void;
};
const C = createContext<Ctx>(null as any);
export const useStore = () => useContext(C);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(m0);
  const [orders, setOrders] = useState(o0);
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOrders((os) => os.map((o) => (o.status === "holding" ? (o.left <= 1 ? { ...o, status: "batal", left: 0 } : { ...o, left: o.left - 1 }) : o))), 1000);
    return () => clearInterval(t);
  }, []);
  const adj = (id: number, d: number) => setMenu((m) => m.map((x) => (x.id === id ? { ...x, stock: Math.max(0, x.stock + d) } : x)));
  const setStatus = (id: string, s: Order["status"]) => setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: s } : o)));
  const addOrder = () =>
    setOrders((os) => [
      {
        id: "#KK-20260918-" + Math.random().toString(16).slice(2, 6).toUpperCase(),
        name: "Pemesan Simulasi",
        phone: "0812-0000-1111",
        items: ["2× Es Teh Solo Jumbo"],
        total: 10000,
        loc: "Kantin Vokasi",
        status: "holding",
        time: new Date().toTimeString().slice(0, 5),
        left: 300,
      },
      ...os,
    ]);
  return <C.Provider value={{ menu, setMenu, orders, on, setOn, adj, setStatus, addOrder }}>{children}</C.Provider>;
}
