// Hook useLiveDashboard: menjaga antrean pesanan dan kuota menu di dashboard penjual tetap terbaru tanpa muat ulang.
// Dipakai di DashboardLive (app/(dashboard)/dashboard/components).
// Caranya polling: bertanya ke server berulang-ulang dengan jeda ("ada perubahan sejak waktu X?").
// Hook React = fungsi `useX` yang menyimpan state dan efek untuk komponen yang memanggilnya.
// "use client": file ini hanya berjalan di peramban (client component), bukan di server.
"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { updatedSinceCursor, mergeOrders, clockOffsetMs } from "@/lib/dashboard";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";

const VISIBLE_INTERVAL_MS = 5000; // jeda polling saat tab sedang dilihat
const HIDDEN_INTERVAL_MS = 30_000; // jeda polling saat tab tersembunyi (hemat baterai dan server)
const MAX_BACKOFF_MS = 60_000; // jeda terpanjang setelah galat beruntun
const REQUEST_TIMEOUT_MS = 15_000; // permintaan menggantung dihitung gagal

// Langganan event online/offline peramban untuk useSyncExternalStore (cara React membaca nilai dari luar React).
const subscribeOnline = (listener: () => void) => {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
};

// Data awal dari halaman server; `loadedAt` = jam server saat halaman dimuat (ms).
type InitialData = { orders: MerchantOrder[]; menus: MerchantMenu[]; loadedAt: number };

/**
 * Menyimpan antrean pesanan dan menu dashboard, lalu menyegarkannya bertahap lewat `GET /api/dashboard/sinkron`.
 * Hanya satu permintaan pada satu waktu (`setTimeout` berantai): tiap 5 dtk saat tab terlihat, 30 dtk saat
 * tersembunyi, dan mundur `min(5 dtk × 2^n, 60 dtk)` setelah n galat beruntun. Langsung menyegarkan saat tab
 * terlihat lagi, saat koneksi kembali `online`, atau saat `refresh()` dipanggil.
 * @param initial pesanan, menu, dan jam server saat halaman dimuat
 * @returns `orders`, `menus`, `lastSyncedAt` (jam sinkron terakhir), `disconnected` (galat atau offline),
 *   `clockOffset` (selisih jam server − jam perangkat, ms), `receiveOrder`/`receiveMenu` (masukkan hasil aksi
 *   pengguna langsung), dan `refresh` (segarkan sekarang)
 */
// shortcut: antrean & kuota "hari ini" tetap saat tab lewat tengah malam WIB; muat ulang bila tanggal berganti, tambah bila dashboard perlu lintas hari
export function useLiveDashboard(initial: InitialData) {
  // 1. Isi store dari data awal halaman.
  const [orders, setOrders] = useState(initial.orders);
  const [menus, setMenus] = useState(initial.menus);
  const [previousInitial, setPreviousInitial] = useState(initial);
  if (initial.orders !== previousInitial.orders || initial.menus !== previousInitial.menus) {
    // 2. Data baru dari halaman server (router.refresh) digabung ke store, tidak menggantinya.
    setPreviousInitial(initial);
    setOrders((currentOrders) => mergeOrders(currentOrders, initial.orders));
    if (initial.menus !== previousInitial.menus) setMenus(initial.menus);
  }
  // 3. Status sinkron: jam sinkron terakhir, galat terakhir, selisih jam server, dan koneksi perangkat.
  const [lastSyncedAt, setLastSyncedAt] = useState(initial.loadedAt);
  const [failed, setFailed] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

  // 4. Nilai terbaru untuk siklus penyegaran (timer & klik) disimpan di ref, jadi efek tidak perlu dipasang ulang.
  //    Ref = kotak nilai milik komponen yang bisa diubah tanpa memicu render ulang.
  const latest = useRef({ orders, loadedAt: initial.loadedAt });
  useEffect(() => {
    latest.current = { orders, loadedAt: initial.loadedAt };
  });
  // Naik setiap kuota disimpan; respons penyegaran yang berangkat sebelumnya tidak menimpa menu yang baru disimpan.
  const menuVersion = useRef(0);
  const triggerRefresh = useRef<() => void>(() => {});

  // 5. Siklus polling, dipasang sekali saat komponen muncul dan dibersihkan saat dilepas.
  //    useEffect = kode yang dijalankan React setelah layar digambar; fungsi yang dikembalikan = pembersihnya.
  useEffect(() => {
    // 5a. Variabel siklus: pembatal saat dilepas, timer berikutnya, dan penghitung galat beruntun.
    const unmountController = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let rerunRequested = false;
    let consecutiveErrors = 0;
    const nextDelay = () =>
      consecutiveErrors
        ? Math.min(VISIBLE_INTERVAL_MS * 2 ** consecutiveErrors, MAX_BACKOFF_MS)
        : document.visibilityState === "visible"
          ? VISIBLE_INTERVAL_MS
          : HIDDEN_INTERVAL_MS;

    // 5b. Isi awal selisih jam dari data awal halaman (jam perangkat saat dipasang, ±1 dtk).
    const seededOffset = clockOffsetMs(latest.current.orders, Date.now());
    if (seededOffset !== null) setClockOffset(seededOffset);

    // 5c. Satu putaran polling.
    async function poll() {
      // 1. Sudah ada yang berjalan: tandai agar diulang segera setelah selesai.
      if (running) {
        rerunRequested = true;
        return;
      }
      clearTimeout(timer);
      running = true;
      const versionAtStart = menuVersion.current;
      // 2. Batas "sejak": dari pesanan terbaru; antrean kosong -> dari jam server halaman (`loadedAt`), tidak pernah
      //    dari jam perangkat yang bisa salah.
      const since = updatedSinceCursor(latest.current.orders, latest.current.loadedAt);
      // 3. Permintaan dibatalkan saat komponen dilepas atau setelah REQUEST_TIMEOUT_MS. Sengaja tanpa
      //    AbortSignal.any/timeout karena belum ada di peramban lama.
      const requestController = new AbortController();
      const abortRequest = () => requestController.abort();
      unmountController.signal.addEventListener("abort", abortRequest);
      const timeoutTimer = setTimeout(abortRequest, REQUEST_TIMEOUT_MS);
      // 4. Ambil perubahan, gabungkan ke store. Menu hanya diganti bila tidak ada kuota yang disimpan selama menunggu.
      try {
        const response = await fetch(`/api/dashboard/sinkron?sejak=${encodeURIComponent(since)}`, {
          signal: requestController.signal,
          cache: "no-store",
        });
        if (response.redirected) {
          // Sesi habis (dialihkan ke login): muat ulang halaman agar setelah login kembali ke /dashboard,
          // bukan ke rute data ini.
          unmountController.abort();
          location.reload();
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        const { data } = (await response.json()) as { data: { orders: MerchantOrder[]; menus: MerchantMenu[] } };
        const receivedAt = Date.now();
        consecutiveErrors = 0;
        setOrders((currentOrders) => mergeOrders(currentOrders, data.orders));
        if (menuVersion.current === versionAtStart) setMenus(data.menus);
        const offset = clockOffsetMs(data.orders, receivedAt);
        if (offset !== null) setClockOffset(offset);
        setLastSyncedAt(receivedAt);
        setFailed(false);
      } catch {
        // 5. Galat: hitung untuk jeda mundur. Dilepas tidak dihitung; batas waktu permintaan tetap dihitung galat.
        if (unmountController.signal.aborted) return;
        consecutiveErrors++;
        setFailed(true);
      } finally {
        clearTimeout(timeoutTimer);
        unmountController.signal.removeEventListener("abort", abortRequest);
        running = false;
      }
      // 6. Jadwalkan putaran berikutnya: segera bila diminta selagi berjalan, selain itu setelah jeda.
      if (unmountController.signal.aborted) return;
      if (rerunRequested) {
        rerunRequested = false;
        void poll();
      } else timer = setTimeout(poll, nextDelay());
    }

    // 5d. Pemicu langsung: tab terlihat lagi, koneksi kembali, atau refresh(); lalu jadwal pertama.
    const pollNow = () => void poll();
    const onVisible = () => document.visibilityState === "visible" && pollNow();
    triggerRefresh.current = pollNow;
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", pollNow);
    timer = setTimeout(poll, nextDelay());
    // 5e. Pembersih: batalkan permintaan, timer, dan semua pendengar event.
    return () => {
      unmountController.abort();
      clearTimeout(timer);
      triggerRefresh.current = () => {};
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", pollNow);
    };
  }, []);

  // 6. Fungsi untuk komponen. useCallback menjaga fungsi yang sama di tiap render.
  // Pesanan hasil aksi pengguna langsung masuk store (dan memperbarui selisih jam).
  const receiveOrder = useCallback((order: MerchantOrder) => {
    setOrders((currentOrders) => mergeOrders(currentOrders, [order]));
    const offset = clockOffsetMs([order], Date.now());
    if (offset !== null) setClockOffset(offset);
  }, []);
  // Menu yang baru disimpan mengganti menu ber-id sama; versi naik agar polling yang sudah berangkat tidak menimpanya.
  const receiveMenu = useCallback((menu: MerchantMenu) => {
    menuVersion.current++;
    setMenus((currentMenus) => currentMenus.map((current) => (current.id === menu.id ? menu : current)));
  }, []);
  const refresh = useCallback(() => triggerRefresh.current(), []);

  return {
    orders,
    menus,
    lastSyncedAt,
    disconnected: failed || !online,
    clockOffset,
    receiveOrder,
    receiveMenu,
    refresh,
  };
}
