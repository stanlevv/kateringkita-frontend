// Hook useQuota: mengubah kuota harian menu dari tombol +/- atau ketikan, lalu mengirimnya ke server dengan aman.
// Dipakai di panel kuota dashboard (QuotaPanel) dan katalog menu (MenuCatalog).
// Hook React = fungsi `useX` yang menyimpan state dan efek untuk komponen yang memanggilnya.
// "use client": file ini hanya berjalan di peramban (client component), bukan di server.
"use client";

import { useEffect, useRef, useState } from "react";
import { adjustQuota } from "@/app/actions/menus";
import { callAction } from "@/lib/action";
import { toast } from "@/app/components/ui/Toast";
import type { MerchantMenu } from "@/types/menu";

// Debounce = menunggu sebentar setelah tekanan/ketikan terakhir, lalu mengirim sekali saja ke server.
const DEBOUNCE_MS = 500;

// Perubahan yang belum dikirim: tambah/kurang (`delta`) atau nilai mutlak (`quota_today`, nama field API).
type PendingMutation = { delta?: number; quota_today?: number };

// Antrean kirim per menu: paling banyak satu permintaan berjalan (`inFlight`), perubahan berikutnya menunggu di `pending`.
type MenuQueue = {
  inFlight: boolean;
  inFlightPayload?: PendingMutation;
  pending?: PendingMutation;
  timer?: ReturnType<typeof setTimeout>;
  currentValue?: number; // Nilai draf sinkron saat ini
};

/**
 * Mengelola perubahan kuota harian menu. Tombol +/- dikirim sebagai selisih (delta) agar dua penjual yang menekan
 * bersamaan tidak saling menimpa; ketikan dikirim sebagai nilai mutlak. Angka di layar (draf) langsung berubah,
 * lalu dikirim setelah jeda. Bila server menolak, hanya bagian yang gagal yang dibatalkan.
 * @param onMenuSaved dipanggil dengan menu terbaru dari server setiap kali simpan berhasil
 * @param menus daftar menu dari server; draf yang sudah tersimpan dibuang saat daftar ini berganti
 * @returns `changeQuota` (delta atau nilai mutlak), `changeQuotaBy` (tambah/kurang), `setQuota` (nilai mutlak),
 *   dan `withDraft` (menu dengan kuota draf untuk ditampilkan)
 */
export function useQuota(onMenuSaved: (menu: MerchantMenu) => void, menus: MerchantMenu[]) {
  // 1. Draf kuota per menu. `saved`: sudah tersimpan di server; draf bertahan sampai `menus` (data server) berganti,
  //    bukan saat simpan sukses, supaya angka tidak sempat melompat kembali ke nilai lama.
  //    useState = nilai yang diingat React di antara render; mengubahnya membuat komponen digambar ulang.
  const [draft, setDraft] = useState<Record<number, { quota: number; saved: boolean }>>({});
  const [seenMenus, setSeenMenus] = useState(menus);
  if (menus !== seenMenus) {
    setSeenMenus(menus);
    setDraft((currentDraft) => Object.fromEntries(Object.entries(currentDraft).filter(([, entry]) => !entry.saved)));
  }

  // 2. Simpan nilai terbaru di ref (kotak nilai yang tidak memicu render ulang) agar timer selalu membaca data terkini.
  //    useEffect = kode yang dijalankan React setelah layar digambar.
  const menusRef = useRef(menus);
  useEffect(() => {
    menusRef.current = menus;
  });

  const queues = useRef(new Map<number, MenuQueue>());
  const onMenuSavedRef = useRef(onMenuSaved);
  useEffect(() => {
    onMenuSavedRef.current = onMenuSaved;
  });

  // 3. Kuota menurut server (dasar perhitungan draf) dan antrean milik satu menu.
  const getBaseline = (id: number): number => {
    return menusRef.current.find((menu) => menu.id === id)?.quota_today ?? 0;
  };

  const getQueue = (id: number): MenuQueue => {
    let queue = queues.current.get(id);
    if (!queue) {
      queue = { inFlight: false };
      queues.current.set(id, queue);
    }
    return queue;
  };

  // 4. Kirim perubahan yang menunggu untuk satu menu ke server.
  async function flushMenu(id: number) {
    // 1. Maksimal satu permintaan berjalan per menu; tanpa perubahan tidak ada yang dikirim.
    const queue = queues.current.get(id);
    if (!queue) return;
    if (queue.inFlight) return;
    if (!queue.pending) return;

    // 2. Delta nol (+1 lalu -1 sebelum jeda habis) tidak dikirim karena backend menolak delta = 0.
    if (queue.pending.quota_today === undefined && queue.pending.delta === 0) {
      queue.pending = undefined;
      queue.currentValue = undefined;
      setDraft((currentDraft) => {
        const nextDraft = { ...currentDraft };
        delete nextDraft[id];
        return nextDraft;
      });
      return;
    }

    // 3. Pindahkan perubahan dari `pending` ke "sedang dikirim", lalu panggil server action adjustQuota.
    const payload = queue.pending;
    queue.pending = undefined;
    queue.inFlight = true;
    queue.inFlightPayload = payload;

    const result = await callAction(() => adjustQuota(id, payload as { delta: number } | { quota_today: number }));
    const ok = "data" in result;
    const sentPayload = queue.inFlightPayload;
    queue.inFlight = false;
    queue.inFlightPayload = undefined;

    if (ok) {
      // 4. Berhasil: kabari pemanggil; draf ditandai tersimpan bila tidak ada perubahan baru yang menunggu.
      onMenuSavedRef.current(result.data);
      if (!(queue as MenuQueue).pending) {
        setDraft((currentDraft) => {
          if (!currentDraft[id]) return currentDraft;
          return { ...currentDraft, [id]: { quota: currentDraft[id].quota, saved: true } };
        });
      }
    } else {
      // 5. Gagal: tampilkan pesan, lalu batalkan hanya bagian yang gagal dari draf.
      toast({ tone: "danger", message: result.error.message });

      const activePending: PendingMutation | undefined = (queue as MenuQueue).pending;
      if (activePending?.quota_today !== undefined) {
        // Pengguna sudah mengetik nilai mutlak baru selagi permintaan berjalan: nilai itu tidak boleh dikurangi
        // oleh delta yang gagal, jadi draf tetap pada nilai yang diketik.
        const absoluteQuota = activePending.quota_today;
        queue.currentValue = absoluteQuota;
        setDraft((currentDraft) => ({ ...currentDraft, [id]: { quota: absoluteQuota, saved: false } }));
      } else if (sentPayload?.delta !== undefined) {
        // Yang gagal berupa delta: kurangi draf sebesar delta itu (draf kembali ke dasar server bila tidak ada sisa).
        const currentValue = queue.currentValue ?? getBaseline(id);
        const rolledBackQuota = currentValue - sentPayload.delta;
        queue.currentValue = rolledBackQuota;
        if (!activePending && rolledBackQuota === getBaseline(id)) {
          queue.currentValue = undefined;
          setDraft((currentDraft) => {
            const nextDraft = { ...currentDraft };
            delete nextDraft[id];
            return nextDraft;
          });
        } else {
          setDraft((currentDraft) => ({ ...currentDraft, [id]: { quota: rolledBackQuota, saved: false } }));
        }
      } else {
        // Yang gagal berupa nilai mutlak: hapus draf, kecuali masih ada perubahan baru yang menunggu.
        if (!activePending) {
          queue.currentValue = undefined;
          setDraft((currentDraft) => {
            const nextDraft = { ...currentDraft };
            delete nextDraft[id];
            return nextDraft;
          });
        } else {
          setDraft((currentDraft) => ({ ...currentDraft, [id]: { quota: queue.currentValue!, saved: false } }));
        }
      }
    }

    // 6. Perubahan yang masuk selama permintaan berjalan dikirim berikutnya, berurutan.
    if (queue.pending) {
      void flushMenu(id);
    }
  }

  const flushMenuRef = useRef(flushMenu);
  useEffect(() => {
    flushMenuRef.current = flushMenu;
  });

  // 5. Saat komponen dilepas (unmount, mis. pindah halaman) sebelum jeda habis, kirim perubahan agar tidak hilang.
  useEffect(() => {
    const queueMap = queues.current;
    return () => {
      // 1. Hentikan timer tiap menu; 2. kirim sekarang bila tidak ada permintaan yang berjalan.
      queueMap.forEach((queue, id) => {
        clearTimeout(queue.timer);
        // Bila ada permintaan berjalan, permintaan itu sendiri yang mengirim `queue.pending` setelah selesai (langkah 6 di flushMenu).
        if (!queue.inFlight && queue.pending) {
          void flushMenuRef.current(id);
        }
      });
    };
  }, []);

  // 6. Tiga cara mengubah kuota yang dikembalikan ke komponen.
  /** Tambah/kurang kuota sebesar `delta` (tombol +/-). */
  function changeQuotaBy(id: number, delta: number) {
    // 1. Hitung draf baru dari draf sekarang (atau dasar server) dan tampilkan.
    const queue = getQueue(id);
    const baseline = getBaseline(id);
    const currentValue = queue.currentValue ?? baseline;
    const nextQuota = currentValue + delta;

    queue.currentValue = nextQuota;
    setDraft((currentDraft) => ({ ...currentDraft, [id]: { quota: nextQuota, saved: false } }));

    // 2. Gabungkan dengan perubahan yang menunggu: bila yang menunggu nilai mutlak, delta ditambahkan ke nilai itu.
    if (queue.pending?.quota_today !== undefined) {
      queue.pending = { quota_today: queue.pending.quota_today + delta };
    } else {
      queue.pending = { delta: (queue.pending?.delta ?? 0) + delta };
    }

    // 3. Mulai ulang jeda; kirim setelah tidak ada tekanan selama DEBOUNCE_MS.
    clearTimeout(queue.timer);
    queue.timer = setTimeout(() => void flushMenuRef.current(id), DEBOUNCE_MS);
  }

  /** Ganti kuota dengan nilai yang diketik. */
  function setQuota(id: number, quota: number) {
    const queue = getQueue(id);
    queue.currentValue = quota;
    setDraft((currentDraft) => ({ ...currentDraft, [id]: { quota, saved: false } }));

    // Nilai mutlak menggantikan delta yang belum terkirim.
    queue.pending = { quota_today: quota };

    clearTimeout(queue.timer);
    queue.timer = setTimeout(() => void flushMenuRef.current(id), DEBOUNCE_MS);
  }

  /** Satu pintu untuk keduanya: angka biasa atau `{ quota_today }` = nilai mutlak, `{ delta }` = tambah/kurang. */
  function changeQuota(id: number, change: number | { delta?: number; quota_today?: number }) {
    if (typeof change === "object" && change !== null) {
      if (change.delta !== undefined) changeQuotaBy(id, change.delta);
      else if (change.quota_today !== undefined) setQuota(id, change.quota_today);
    } else {
      setQuota(id, change);
    }
  }

  /** Terapkan draf kuota ke menu (tersedia dihitung ulang). */
  const withDraft = (menu: MerchantMenu): MerchantMenu =>
    draft[menu.id] === undefined
      ? menu
      : {
          ...menu,
          quota_today: draft[menu.id].quota,
          available: draft[menu.id].quota - menu.sold_today - menu.held_today,
        };

  return { changeQuota, changeQuotaBy, setQuota, withDraft };
}
