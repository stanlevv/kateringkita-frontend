"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { batasSejak, satukanPesanan, selisihJam } from "@/lib/dashboard";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";

const TERLIHAT_MS = 5000;
const TERSEMBUNYI_MS = 30_000;
const MAKS_MUNDUR_MS = 60_000;
const BATAS_MS = 15_000; // permintaan menggantung dihitung gagal

const langganOnline = (f: () => void) => {
  window.addEventListener("online", f);
  window.addEventListener("offline", f);
  return () => {
    window.removeEventListener("online", f);
    window.removeEventListener("offline", f);
  };
};

type Awal = { orders: MerchantOrder[]; menus: MerchantMenu[]; dimuat: number };

/**
 * M-04, D5–D8: store antrean dashboard yang disegarkan bertahap lewat `GET /api/dashboard/sinkron`.
 * Satu permintaan pada satu waktu (`setTimeout` berantai): 5 dtk terlihat, 30 dtk tersembunyi,
 * mundur `min(5 dtk × 2^n, 60 dtk)` saat galat; langsung saat tab terlihat lagi, `online`, atau `segarkan()`.
 */
// shortcut: antrean & kuota "hari ini" tetap saat tab lewat tengah malam WIB; muat ulang bila tanggal berganti, tambah bila lintas hari (D14)
export function useLangsung(awal: Awal) {
  const [orders, setOrders] = useState(awal.orders);
  const [menus, setMenus] = useState(awal.menus);
  const [dari, setDari] = useState(awal);
  if (awal.orders !== dari.orders || awal.menus !== dari.menus) {
    // D11: data baru dari halaman server (router.refresh) disatukan, tidak mengganti store.
    setDari(awal);
    setOrders((l) => satukanPesanan(l, awal.orders));
    if (awal.menus !== dari.menus) setMenus(awal.menus);
  }
  const [terakhir, setTerakhir] = useState(awal.dimuat);
  const [gagal, setGagal] = useState(false);
  const [selisih, setSelisih] = useState(0);
  const online = useSyncExternalStore(langganOnline, () => navigator.onLine, () => true);

  // Nilai terbaru untuk siklus penyegaran (timer & klik) tanpa memasang ulang efek.
  const terkini = useRef({ orders, dimuat: awal.dimuat });
  useEffect(() => { terkini.current = { orders, dimuat: awal.dimuat }; });
  // Naik setiap kuota disimpan; respons penyegaran yang berangkat sebelumnya tidak menimpa menu (D10).
  const versiMenu = useRef(0);
  const picu = useRef<() => void>(() => {});

  useEffect(() => {
    const ctl = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let jalan = false;
    let lagi = false;
    let galatBeruntun = 0;
    const jeda = () =>
      galatBeruntun ? Math.min(TERLIHAT_MS * 2 ** galatBeruntun, MAKS_MUNDUR_MS) : document.visibilityState === "visible" ? TERLIHAT_MS : TERSEMBUNYI_MS;

    // D8: semai selisih jam dari data awal halaman (jam perangkat saat dipasang, ±1 dtk).
    const semai = selisihJam(terkini.current.orders, Date.now());
    if (semai !== null) setSelisih(semai);

    async function tarik() {
      if (jalan) {
        lagi = true; // sudah ada yang berjalan: ulangi segera setelah selesai
        return;
      }
      clearTimeout(timer);
      jalan = true;
      const versi = versiMenu.current;
      // D3: antrean kosong -> batas dari jam server halaman (`dimuat`), tidak pernah dari jam perangkat.
      const sejak = batasSejak(terkini.current.orders, terkini.current.dimuat);
      // Per permintaan: batal saat dilepas atau setelah BATAS_MS (tanpa AbortSignal.any/timeout, belum ada di peramban lama).
      const minta = new AbortController();
      const batal = () => minta.abort();
      ctl.signal.addEventListener("abort", batal);
      const batasWaktu = setTimeout(batal, BATAS_MS);
      try {
        const res = await fetch(`/api/dashboard/sinkron?sejak=${encodeURIComponent(sejak)}`, { signal: minta.signal, cache: "no-store" });
        if (res.redirected) {
          // D7: sesi habis -> muat ulang halaman agar login kembali ke /dashboard, bukan ke rute data ini.
          ctl.abort();
          location.reload();
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const { data } = (await res.json()) as { data: { orders: MerchantOrder[]; menus: MerchantMenu[] } };
        const diterima = Date.now();
        galatBeruntun = 0;
        setOrders((l) => satukanPesanan(l, data.orders));
        if (versiMenu.current === versi) setMenus(data.menus);
        const s = selisihJam(data.orders, diterima);
        if (s !== null) setSelisih(s);
        setTerakhir(diterima);
        setGagal(false);
      } catch {
        if (ctl.signal.aborted) return; // dilepas; batas waktu permintaan tetap dihitung galat
        galatBeruntun++;
        setGagal(true);
      } finally {
        clearTimeout(batasWaktu);
        ctl.signal.removeEventListener("abort", batal);
        jalan = false;
      }
      if (ctl.signal.aborted) return;
      if (lagi) {
        lagi = false;
        void tarik();
      } else timer = setTimeout(tarik, jeda());
    }

    const segera = () => void tarik();
    const saatTerlihat = () => document.visibilityState === "visible" && segera();
    picu.current = segera;
    document.addEventListener("visibilitychange", saatTerlihat);
    window.addEventListener("online", segera);
    timer = setTimeout(tarik, jeda());
    return () => {
      ctl.abort();
      clearTimeout(timer);
      picu.current = () => {};
      document.removeEventListener("visibilitychange", saatTerlihat);
      window.removeEventListener("online", segera);
    };
  }, []);

  const terima = useCallback((o: MerchantOrder) => {
    setOrders((l) => satukanPesanan(l, [o]));
    const s = selisihJam([o], Date.now());
    if (s !== null) setSelisih(s);
  }, []);
  const terimaMenu = useCallback((m: MerchantMenu) => {
    versiMenu.current++;
    setMenus((l) => l.map((x) => (x.id === m.id ? m : x)));
  }, []);
  const segarkan = useCallback(() => picu.current(), []);

  return { orders, menus, terakhir, putus: gagal || !online, selisih, terima, terimaMenu, segarkan };
}
