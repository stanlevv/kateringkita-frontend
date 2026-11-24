// Hook useNotifications: memberi tahu penjual saat ada pesanan baru di dashboard (sorot kartu, bunyi, judul tab,
// dan pengumuman untuk pembaca layar). Dipakai di DashboardLive (app/(dashboard)/dashboard/components).
// Hook React = fungsi `useX` yang menyimpan state dan efek untuk komponen yang memanggilnya.
// "use client": file ini hanya berjalan di peramban (client component), bukan di server.
"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { NEW_ORDER_MS } from "@/lib/dashboard";
import { countNeedsAction } from "@/lib/shell";
import { toWibClock, wibDate } from "@/lib/format";
import type { MerchantOrder } from "@/types/order";

// Kunci localStorage (penyimpanan kecil di peramban) untuk pilihan suara. Nilainya "1"/"0"; jangan diganti,
// karena pilihan yang sudah tersimpan di peramban penjual akan hilang.
const SOUND_STORAGE_KEY = "kk_suara";
const HIGHLIGHT_MS = 3000; // lama kartu pesanan baru disorot

// Preferensi suara per peramban; cadangan di memori bila localStorage diblokir.
let soundFallback: boolean | null = null;
const soundListeners = new Set<() => void>();
/** Membaca pilihan suara (bawaan: menyala). @returns true bila suara menyala */
function readSoundEnabled(): boolean {
  try {
    const storedValue = localStorage.getItem(SOUND_STORAGE_KEY);
    if (storedValue !== null) return storedValue !== "0";
  } catch {
    /* diblokir */
  }
  return soundFallback ?? true;
}
/** Menyimpan pilihan suara lalu memberi tahu semua komponen yang membacanya. */
function writeSoundEnabled(enabled: boolean) {
  soundFallback = enabled;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* diblokir */
  }
  soundListeners.forEach((listener) => listener());
}
// Langganan perubahan pilihan suara untuk useSyncExternalStore (cara React membaca nilai dari luar React).
const subscribeSound = (listener: () => void) => {
  soundListeners.add(listener);
  return () => {
    soundListeners.delete(listener);
  };
};

/** Bunyi pendek lewat Web Audio (tanpa file aset). Diam bila peramban menolak. */
function playBeep() {
  try {
    // 1. Buat nada 880 Hz bervolume rendah.
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.1;
    // 2. Sambungkan ke speaker, mainkan 0,15 dtk, lalu tutup konteks audionya.
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.onended = () => void audioContext.close();
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch {
    /* tanpa suara */
  }
}

// Kode yang sudah berbunyi selama muat halaman ini (tahan StrictMode & pasang ulang komponen).
const beepedCodes = new Set<string>();

/** Penjual sedang tidak melihat tab ini. Di server: dianggap melihat (tanpa judul). */
const isTabUnseen = () => typeof document !== "undefined" && (document.hidden || !document.hasFocus());

/**
 * Mendeteksi pesanan baru dan memberi tahu penjual. Pesanan baru = dibuat < 60 dtk saat halaman pertama dimuat,
 * atau muncul di penyegaran berikutnya. Kartunya disorot 3 dtk, judul tab menjadi "(N) Pesanan baru" sampai jendela
 * difokus lagi, dan berbunyi bila suara menyala.
 * @param orders antrean pesanan terbaru (dari useLiveDashboard)
 * @param loadedAt jam server saat halaman dimuat (ms)
 * @param now jam server sekarang (jam perangkat + selisih jam), untuk menentukan "hari ini" WIB
 * @returns `newOrderCodes` (kode yang sedang disorot), `announcement` (teks untuk wilayah aria-live),
 *   `soundOn`, dan `setSoundOn`
 */
export function useNotifications(orders: MerchantOrder[], loadedAt: number, now = loadedAt) {
  // 1. Pilihan suara, pesanan sebelumnya, kode yang disorot, jumlah belum dilihat, dan nomor gelombang pengumuman.
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
    // 2. Cari pesanan hari ini (WIB, jam server) yang BARU menjadi "perlu tindakan": baru masuk, atau pesanan VA/online
    //    yang tadi menunggu bayar lalu lunas (diterima otomatis). Yang belum lunas tidak berbunyi: penjual belum bisa
    //    berbuat apa-apa.
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

  // 3. Bunyi sekali per kode, lalu hapus sorotan setelah HIGHLIGHT_MS. useEffect = kode setelah layar digambar.
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

  // 4. Tab kembali dilihat: hitungan "belum dilihat" kembali nol.
  useEffect(() => {
    const markSeen = () => document.visibilityState === "visible" && setUnseenCount(0);
    window.addEventListener("focus", markSeen);
    document.addEventListener("visibilitychange", markSeen);
    return () => {
      window.removeEventListener("focus", markSeen);
      document.removeEventListener("visibilitychange", markSeen);
    };
  }, []);

  // 5. Selama ada yang belum dilihat, judul tab menjadi "(N) Pesanan baru"; dikembalikan saat hitungan nol.
  useEffect(() => {
    if (!unseenCount) return;
    const originalTitle = document.title;
    document.title = `(${unseenCount}) Pesanan baru · KateringKita`;
    return () => {
      document.title = originalTitle;
    };
  }, [unseenCount]);

  // 6. Teks untuk pembaca layar (aria-live = wilayah yang isinya dibacakan otomatis saat berubah) selama sorotan
  //    berlangsung. Spasi tak terlihat bergantian agar gelombang berikut dengan teks sama tetap dibacakan.
  const announcement = highlighted.length
    ? `${highlighted.length} pesanan baru masuk${announcementWave % 2 ? " " : ""}`
    : "";
  return { newOrderCodes: highlighted, announcement, soundOn, setSoundOn: writeSoundEnabled };
}
