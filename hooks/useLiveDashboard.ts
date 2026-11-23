"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { updatedSinceCursor, mergeOrders, clockOffsetMs } from "@/lib/dashboard";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";

const VISIBLE_INTERVAL_MS = 5000;
const HIDDEN_INTERVAL_MS = 30_000;
const MAX_BACKOFF_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000; // permintaan menggantung dihitung gagal

const subscribeOnline = (listener: () => void) => {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
};

type InitialData = { orders: MerchantOrder[]; menus: MerchantMenu[]; loadedAt: number };

/**
 * M-04, D5–D8: store antrean dashboard yang disegarkan bertahap lewat `GET /api/dashboard/sinkron`.
 * Satu permintaan pada satu waktu (`setTimeout` berantai): 5 dtk terlihat, 30 dtk tersembunyi,
 * mundur `min(5 dtk × 2^n, 60 dtk)` saat galat; langsung saat tab terlihat lagi, `online`, atau `segarkan()`.
 */
// shortcut: antrean & kuota "hari ini" tetap saat tab lewat tengah malam WIB; muat ulang bila tanggal berganti, tambah bila lintas hari (D14)
export function useLiveDashboard(initial: InitialData) {
  const [orders, setOrders] = useState(initial.orders);
  const [menus, setMenus] = useState(initial.menus);
  const [previousInitial, setPreviousInitial] = useState(initial);
  if (initial.orders !== previousInitial.orders || initial.menus !== previousInitial.menus) {
    // D11: data baru dari halaman server (router.refresh) disatukan, tidak mengganti store.
    setPreviousInitial(initial);
    setOrders((currentOrders) => mergeOrders(currentOrders, initial.orders));
    if (initial.menus !== previousInitial.menus) setMenus(initial.menus);
  }
  const [lastSyncedAt, setLastSyncedAt] = useState(initial.loadedAt);
  const [failed, setFailed] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

  // Nilai terbaru untuk siklus penyegaran (timer & klik) tanpa memasang ulang efek.
  const latest = useRef({ orders, loadedAt: initial.loadedAt });
  useEffect(() => {
    latest.current = { orders, loadedAt: initial.loadedAt };
  });
  // Naik setiap kuota disimpan; respons penyegaran yang berangkat sebelumnya tidak menimpa menu (D10).
  const menuVersion = useRef(0);
  const triggerRefresh = useRef<() => void>(() => {});

  useEffect(() => {
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

    // D8: semai selisih jam dari data awal halaman (jam perangkat saat dipasang, ±1 dtk).
    const seededOffset = clockOffsetMs(latest.current.orders, Date.now());
    if (seededOffset !== null) setClockOffset(seededOffset);

    async function poll() {
      if (running) {
        rerunRequested = true; // sudah ada yang berjalan: ulangi segera setelah selesai
        return;
      }
      clearTimeout(timer);
      running = true;
      const versionAtStart = menuVersion.current;
      // D3: antrean kosong -> batas dari jam server halaman (`dimuat`), tidak pernah dari jam perangkat.
      const since = updatedSinceCursor(latest.current.orders, latest.current.loadedAt);
      // Per permintaan: batal saat dilepas atau setelah BATAS_MS (tanpa AbortSignal.any/timeout, belum ada di peramban lama).
      const requestController = new AbortController();
      const abortRequest = () => requestController.abort();
      unmountController.signal.addEventListener("abort", abortRequest);
      const timeoutTimer = setTimeout(abortRequest, REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(`/api/dashboard/sinkron?sejak=${encodeURIComponent(since)}`, {
          signal: requestController.signal,
          cache: "no-store",
        });
        if (response.redirected) {
          // D7: sesi habis -> muat ulang halaman agar login kembali ke /dashboard, bukan ke rute data ini.
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
        if (unmountController.signal.aborted) return; // dilepas; batas waktu permintaan tetap dihitung galat
        consecutiveErrors++;
        setFailed(true);
      } finally {
        clearTimeout(timeoutTimer);
        unmountController.signal.removeEventListener("abort", abortRequest);
        running = false;
      }
      if (unmountController.signal.aborted) return;
      if (rerunRequested) {
        rerunRequested = false;
        void poll();
      } else timer = setTimeout(poll, nextDelay());
    }

    const pollNow = () => void poll();
    const onVisible = () => document.visibilityState === "visible" && pollNow();
    triggerRefresh.current = pollNow;
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", pollNow);
    timer = setTimeout(poll, nextDelay());
    return () => {
      unmountController.abort();
      clearTimeout(timer);
      triggerRefresh.current = () => {};
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", pollNow);
    };
  }, []);

  const receiveOrder = useCallback((order: MerchantOrder) => {
    setOrders((currentOrders) => mergeOrders(currentOrders, [order]));
    const offset = clockOffsetMs([order], Date.now());
    if (offset !== null) setClockOffset(offset);
  }, []);
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
