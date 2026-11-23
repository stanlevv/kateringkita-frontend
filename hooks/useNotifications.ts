"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { NEW_ORDER_MS } from "@/lib/dashboard";
import { countNeedsAction } from "@/lib/shell";
import { toWibClock, wibDate } from "@/lib/format";
import type { MerchantOrder } from "@/types/order";

const SOUND_STORAGE_KEY = "kk_suara";
const HIGHLIGHT_MS = 3000;

// Preferensi suara per peramban; cadangan di memori bila localStorage diblokir.
let soundFallback: boolean | null = null;
const soundListeners = new Set<() => void>();
function readSoundEnabled(): boolean {
  try {
    const storedValue = localStorage.getItem(SOUND_STORAGE_KEY);
    if (storedValue !== null) return storedValue !== "0";
  } catch {
    /* diblokir */
  }
  return soundFallback ?? true;
}
function writeSoundEnabled(enabled: boolean) {
  soundFallback = enabled;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* diblokir */
  }
  soundListeners.forEach((listener) => listener());
}
const subscribeSound = (listener: () => void) => {
  soundListeners.add(listener);
  return () => {
    soundListeners.delete(listener);
  };
};

/** Bunyi pendek lewat Web Audio (tanpa file aset). Diam bila peramban menolak. */
function playBeep() {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.1;
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.onended = () => void audioContext.close();
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch {
    /* tanpa suara */
  }
}

/**
 * DB-A3: pesanan baru = dibuat < 60 dtk saat pertama dimuat, atau muncul di muat ulang berikutnya.
 * Sorot 3 dtk, judul tab "(N) Pesanan baru" sampai jendela difokus lagi, bunyi bila suara aktif.
 */
// Kode yang sudah berbunyi selama muat halaman ini (tahan StrictMode & pasang ulang komponen).
const beepedCodes = new Set<string>();

/** Penjual sedang tidak melihat tab ini. Di server: dianggap melihat (tanpa judul). */
const isTabUnseen = () => typeof document !== "undefined" && (document.hidden || !document.hasFocus());

/** `sekarang`: jam server (jam perangkat + selisih, D8) untuk menentukan "hari ini". */
export function useNotifications(orders: MerchantOrder[], loadedAt: number, now = loadedAt) {
  const soundOn = useSyncExternalStore(subscribeSound, readSoundEnabled, () => true);
  const [previousOrders, setPreviousOrders] = useState(orders);
  const [highlighted, setHighlighted] = useState<string[]>(() =>
    orders
      .filter((order) => countNeedsAction([order]) === 1 && loadedAt - Date.parse(order.created_at) < NEW_ORDER_MS)
      .map((order) => order.code),
  );
  const [unseenCount, setUnseenCount] = useState(() => (isTabUnseen() ? highlighted.length : 0));
  const [announcementWave, setAnnouncementWave] = useState(0);

  if (orders !== previousOrders) {
    // Pesanan dibuat hari ini (WIB, jam server) yang BARU menjadi "perlu tindakan": baru masuk, atau VA/online yang tadi
    // menunggu bayar lalu lunas (F26, diterima otomatis). Yang belum lunas tidak berbunyi: penjual belum bisa apa-apa.
    const previouslyActionable = new Set(
      previousOrders.filter((order) => countNeedsAction([order]) === 1).map((order) => order.code),
    );
    const today = toWibClock(now).toISOString().slice(0, 10);
    const incomingCodes = orders
      .filter(
        (order) =>
          !previouslyActionable.has(order.code) &&
          countNeedsAction([order]) === 1 &&
          wibDate(order.created_at) === today,
      )
      .map((order) => order.code);
    setPreviousOrders(orders);
    if (incomingCodes.length) {
      setHighlighted(incomingCodes);
      setAnnouncementWave((previousWave) => previousWave + 1);
      if (isTabUnseen()) setUnseenCount((previousCount) => previousCount + incomingCodes.length);
    }
  }

  const soundOnRef = useRef(soundOn);
  useEffect(() => {
    soundOnRef.current = soundOn;
  });
  useEffect(() => {
    if (!highlighted.length) return;
    const notYetBeeped = highlighted.filter((code) => !beepedCodes.has(code));
    notYetBeeped.forEach((code) => beepedCodes.add(code));
    if (notYetBeeped.length && soundOnRef.current) playBeep();
    const timer = setTimeout(() => setHighlighted([]), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlighted]);

  useEffect(() => {
    const markSeen = () => document.visibilityState === "visible" && setUnseenCount(0);
    window.addEventListener("focus", markSeen);
    document.addEventListener("visibilitychange", markSeen);
    return () => {
      window.removeEventListener("focus", markSeen);
      document.removeEventListener("visibilitychange", markSeen);
    };
  }, []);

  useEffect(() => {
    if (!unseenCount) return;
    const originalTitle = document.title;
    document.title = `(${unseenCount}) Pesanan baru · KateringKita`;
    return () => {
      document.title = originalTitle;
    };
  }, [unseenCount]);

  // D9: diumumkan pembaca layar (aria-live) selama sorot berlangsung.
  // Spasi tak terlihat bergantian agar gelombang berikut dengan teks sama tetap diumumkan.
  const announcement = highlighted.length
    ? `${highlighted.length} pesanan baru masuk${announcementWave % 2 ? " " : ""}`
    : "";
  return { newOrderCodes: highlighted, announcement, soundOn, setSoundOn: writeSoundEnabled };
}
