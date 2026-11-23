"use client";

import { useEffect, useRef, useState } from "react";
import { adjustQuota } from "@/app/actions/menus";
import { callAction } from "@/lib/action";
import { toast } from "@/app/components/ui/Toast";
import type { MerchantMenu } from "@/types/menu";

const DEBOUNCE_MS = 500; // jeda debounce penekanan stepper / ketik sebelum dikirim ke server

type PendingMutation = { delta?: number; quota_today?: number };

type MenuQueue = {
  inFlight: boolean;
  inFlightPayload?: PendingMutation;
  pending?: PendingMutation;
  timer?: ReturnType<typeof setTimeout>;
  currentValue?: number; // Nilai draf sinkron saat ini
};

/**
 * F04 / AUD-04: Hook kuota atomik penjual dengan dukungan operasi delta, serialisasi in-flight,
 * supresi delta nol, operasi campuran, dan rollback granular.
 */
export function useQuota(onMenuSaved: (menu: MerchantMenu) => void, menus: MerchantMenu[]) {
  // `terkirim`: sudah tersimpan di server; draf bertahan sampai `menus` (data server) berganti, bukan saat simpan sukses.
  const [draft, setDraft] = useState<Record<number, { quota: number; saved: boolean }>>({});
  const [seenMenus, setSeenMenus] = useState(menus);
  if (menus !== seenMenus) {
    setSeenMenus(menus);
    setDraft((currentDraft) => Object.fromEntries(Object.entries(currentDraft).filter(([, entry]) => !entry.saved)));
  }

  const menusRef = useRef(menus);
  useEffect(() => {
    menusRef.current = menus;
  });

  const queues = useRef(new Map<number, MenuQueue>());
  const onMenuSavedRef = useRef(onMenuSaved);
  useEffect(() => {
    onMenuSavedRef.current = onMenuSaved;
  });

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

  async function flushMenu(id: number) {
    const queue = queues.current.get(id);
    if (!queue) return;

    // Maksimal satu request berjalan per menu
    if (queue.inFlight) return;
    if (!queue.pending) return;

    // Supresi delta nol: +1 lalu -1 sebelum debounce tidak dikirim karena backend menolak delta = 0
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
      onMenuSavedRef.current(result.data);
      // Jika tidak ada mutasi pending baru, tandai terkirim
      if (!(queue as MenuQueue).pending) {
        setDraft((currentDraft) => {
          if (!currentDraft[id]) return currentDraft;
          return { ...currentDraft, [id]: { quota: currentDraft[id].quota, saved: true } };
        });
      }
    } else {
      toast({ tone: "danger", message: result.error.message });

      // Rollback granular & rekonstruksi draf:
      const activePending: PendingMutation | undefined = (queue as MenuQueue).pending;
      if (activePending?.quota_today !== undefined) {
        // Ketentuan tambahan: jika pengguna mengetik nilai mutlak baru saat request in-flight,
        // pending nilai mutlak TIDAK boleh dikurangi oleh delta gagal; draf tetap pada nilai mutlak tersebut.
        const absoluteQuota = activePending.quota_today;
        queue.currentValue = absoluteQuota;
        setDraft((currentDraft) => ({ ...currentDraft, [id]: { quota: absoluteQuota, saved: false } }));
      } else if (sentPayload?.delta !== undefined) {
        // Jika request yang gagal berupa delta:
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
        // Jika request yang gagal berupa nilai mutlak:
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

    // Jika ada mutasi baru yang masuk selama request berjalan, proses berikutnya secara sekuensial
    if (queue.pending) {
      void flushMenu(id);
    }
  }

  const flushMenuRef = useRef(flushMenu);
  useEffect(() => {
    flushMenuRef.current = flushMenu;
  });

  // Pindah halaman / unmount sebelum jeda habis: flush pending agar tidak hilang
  useEffect(() => {
    const queueMap = queues.current;
    return () => {
      queueMap.forEach((queue, id) => {
        clearTimeout(queue.timer);
        // Bila tidak in-flight, flush sekarang.
        // Bila sedang in-flight, promise in-flight yang sedang berjalan akan otomatis mengeksekusi q.pending setelahnya
        if (!queue.inFlight && queue.pending) {
          void flushMenuRef.current(id);
        }
      });
    };
  }, []);

  function changeQuotaBy(id: number, delta: number) {
    const queue = getQueue(id);
    const baseline = getBaseline(id);
    const currentValue = queue.currentValue ?? baseline;
    const nextQuota = currentValue + delta;

    queue.currentValue = nextQuota;
    setDraft((currentDraft) => ({ ...currentDraft, [id]: { quota: nextQuota, saved: false } }));

    // Operasi campuran: bila ada pending mutlak, tambahkan delta ke nilai mutlak tersebut
    if (queue.pending?.quota_today !== undefined) {
      queue.pending = { quota_today: queue.pending.quota_today + delta };
    } else {
      queue.pending = { delta: (queue.pending?.delta ?? 0) + delta };
    }

    clearTimeout(queue.timer);
    queue.timer = setTimeout(() => void flushMenuRef.current(id), DEBOUNCE_MS);
  }

  function setQuota(id: number, quota: number) {
    const queue = getQueue(id);
    queue.currentValue = quota;
    setDraft((currentDraft) => ({ ...currentDraft, [id]: { quota, saved: false } }));

    // Pengisian nilai mutlak menggantikan/membatalkan pending delta sebelumnya
    queue.pending = { quota_today: quota };

    clearTimeout(queue.timer);
    queue.timer = setTimeout(() => void flushMenuRef.current(id), DEBOUNCE_MS);
  }

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
