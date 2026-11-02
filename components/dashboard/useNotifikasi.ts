"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BARU_MS } from "@/lib/dashboard";
import { perluTindakan } from "@/lib/shell";
import { geserWib, tanggalWib } from "@/lib/format";
import type { MerchantOrder } from "@/lib/types";

const KUNCI = "kk_suara";
const SOROT_MS = 3000;

// Preferensi suara per peramban; cadangan di memori bila localStorage diblokir.
let memori: boolean | null = null;
const pendengar = new Set<() => void>();
function bacaSuara(): boolean {
  try {
    const v = localStorage.getItem(KUNCI);
    if (v !== null) return v !== "0";
  } catch { /* diblokir */ }
  return memori ?? true;
}
function tulisSuara(v: boolean) {
  memori = v;
  try { localStorage.setItem(KUNCI, v ? "1" : "0"); } catch { /* diblokir */ }
  pendengar.forEach((f) => f());
}
const langgan = (f: () => void) => {
  pendengar.add(f);
  return () => { pendengar.delete(f); };
};

/** Bunyi pendek lewat Web Audio (tanpa file aset). Diam bila peramban menolak. */
function bunyi() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    osc.connect(gain).connect(ctx.destination);
    osc.onended = () => void ctx.close();
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* tanpa suara */ }
}

/**
 * DB-A3: pesanan baru = dibuat < 60 dtk saat pertama dimuat, atau muncul di muat ulang berikutnya.
 * Sorot 3 dtk, judul tab "(N) Pesanan baru" sampai jendela difokus lagi, bunyi bila suara aktif.
 */
// Kode yang sudah berbunyi selama muat halaman ini (tahan StrictMode & pasang ulang komponen).
const sudahBerbunyi = new Set<string>();

/** Penjual sedang tidak melihat tab ini. Di server: dianggap melihat (tanpa judul). */
const tidakDilihat = () => typeof document !== "undefined" && (document.hidden || !document.hasFocus());

/** `sekarang`: jam server (jam perangkat + selisih, D8) untuk menentukan "hari ini". */
export function useNotifikasi(orders: MerchantOrder[], dimuat: number, sekarang = dimuat) {
  const suara = useSyncExternalStore(langgan, bacaSuara, () => true);
  const [lama, setLama] = useState(orders);
  const [sorot, setSorot] = useState<string[]>(() => orders.filter((o) => dimuat - Date.parse(o.created_at) < BARU_MS).map((o) => o.code));
  const [belumDilihat, setBelumDilihat] = useState(() => (tidakDilihat() ? sorot.length : 0));
  const [gelombang, setGelombang] = useState(0);

  if (orders !== lama) {
    const dikenal = new Set(lama.map((o) => o.code));
    // Hanya pesanan "perlu tindakan" (holding/confirmed: QRIS bisa lunas sebelum terlihat) yang dibuat hari ini WIB menurut jam server.
    const hari = geserWib(sekarang).toISOString().slice(0, 10);
    const masuk = orders.filter((o) => !dikenal.has(o.code) && perluTindakan([o]) === 1 && tanggalWib(o.created_at) === hari).map((o) => o.code);
    setLama(orders);
    if (masuk.length) {
      setSorot(masuk);
      setGelombang((g) => g + 1);
      if (tidakDilihat()) setBelumDilihat((n) => n + masuk.length);
    }
  }

  const suaraRef = useRef(suara);
  useEffect(() => { suaraRef.current = suara; });
  useEffect(() => {
    if (!sorot.length) return;
    const belum = sorot.filter((c) => !sudahBerbunyi.has(c));
    belum.forEach((c) => sudahBerbunyi.add(c));
    if (belum.length && suaraRef.current) bunyi();
    const t = setTimeout(() => setSorot([]), SOROT_MS);
    return () => clearTimeout(t);
  }, [sorot]);

  useEffect(() => {
    const dilihat = () => document.visibilityState === "visible" && setBelumDilihat(0);
    window.addEventListener("focus", dilihat);
    document.addEventListener("visibilitychange", dilihat);
    return () => {
      window.removeEventListener("focus", dilihat);
      document.removeEventListener("visibilitychange", dilihat);
    };
  }, []);

  useEffect(() => {
    if (!belumDilihat) return;
    const asli = document.title;
    document.title = `(${belumDilihat}) Pesanan baru · KateringKita`;
    return () => { document.title = asli; };
  }, [belumDilihat]);

  // D9: diumumkan pembaca layar (aria-live) selama sorot berlangsung.
  // Spasi tak terlihat bergantian agar gelombang berikut dengan teks sama tetap diumumkan.
  const umumkan = sorot.length ? `${sorot.length} pesanan baru masuk${gelombang % 2 ? " " : ""}` : "";
  return { baru: sorot, umumkan, suara, setSuara: tulisSuara };
}
