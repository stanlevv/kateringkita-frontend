"use client";

import { useEffect, useRef, useState } from "react";
import { adjustQuota } from "@/app/actions/menus";
import { panggil } from "@/lib/aksi";
import { toast } from "@/app/components/ui/Toast";
import type { MerchantMenu } from "@/types/menu";

const JEDA = 500; // jeda debounce penekanan stepper / ketik sebelum dikirim ke server

type PendingMutation = { delta?: number; quota_today?: number };

type MenuQueue = {
  inFlight: boolean;
  inFlightPayload?: PendingMutation;
  pending?: PendingMutation;
  timer?: ReturnType<typeof setTimeout>;
  currentVal?: number; // Nilai draf sinkron saat ini
};

/**
 * F04 / AUD-04: Hook kuota atomik penjual dengan dukungan operasi delta, serialisasi in-flight,
 * supresi delta nol, operasi campuran, dan rollback granular.
 */
export function useKuota(onBerubah: (m: MerchantMenu) => void, menus: MerchantMenu[]) {
  // `terkirim`: sudah tersimpan di server; draf bertahan sampai `menus` (data server) berganti, bukan saat simpan sukses.
  const [draft, setDraft] = useState<Record<number, { n: number; terkirim: boolean }>>({});
  const [dariMenus, setDariMenus] = useState(menus);
  if (menus !== dariMenus) {
    setDariMenus(menus);
    setDraft((d) => Object.fromEntries(Object.entries(d).filter(([, v]) => !v.terkirim)));
  }

  const menusRef = useRef(menus);
  useEffect(() => {
    menusRef.current = menus;
  });

  const antre = useRef(new Map<number, MenuQueue>());
  const onBerubahRef = useRef(onBerubah);
  useEffect(() => {
    onBerubahRef.current = onBerubah;
  });

  const getBaseline = (id: number): number => {
    return menusRef.current.find((m) => m.id === id)?.quota_today ?? 0;
  };

  const getQueue = (id: number): MenuQueue => {
    let q = antre.current.get(id);
    if (!q) {
      q = { inFlight: false };
      antre.current.set(id, q);
    }
    return q;
  };

  async function flushMenu(id: number) {
    const q = antre.current.get(id);
    if (!q) return;

    // Maksimal satu request berjalan per menu
    if (q.inFlight) return;
    if (!q.pending) return;

    // Supresi delta nol: +1 lalu -1 sebelum debounce tidak dikirim karena backend menolak delta = 0
    if (q.pending.quota_today === undefined && q.pending.delta === 0) {
      q.pending = undefined;
      q.currentVal = undefined;
      setDraft((d) => {
        const s = { ...d };
        delete s[id];
        return s;
      });
      return;
    }

    const payload = q.pending;
    q.pending = undefined;
    q.inFlight = true;
    q.inFlightPayload = payload;

    const r = await panggil(() => adjustQuota(id, payload as { delta: number } | { quota_today: number }));
    const ok = "data" in r;
    const sentPayload = q.inFlightPayload;
    q.inFlight = false;
    q.inFlightPayload = undefined;

    if (ok) {
      onBerubahRef.current(r.data);
      // Jika tidak ada mutasi pending baru, tandai terkirim
      if (!(q as MenuQueue).pending) {
        setDraft((d) => {
          if (!d[id]) return d;
          return { ...d, [id]: { n: d[id].n, terkirim: true } };
        });
      }
    } else {
      toast({ tone: "danger", message: r.error.message });

      // Rollback granular & rekonstruksi draf:
      const activePending: PendingMutation | undefined = (q as MenuQueue).pending;
      if (activePending?.quota_today !== undefined) {
        // Ketentuan tambahan: jika pengguna mengetik nilai mutlak baru saat request in-flight,
        // pending nilai mutlak TIDAK boleh dikurangi oleh delta gagal; draf tetap pada nilai mutlak tersebut.
        const val = activePending.quota_today;
        q.currentVal = val;
        setDraft((d) => ({ ...d, [id]: { n: val, terkirim: false } }));
      } else if (sentPayload?.delta !== undefined) {
        // Jika request yang gagal berupa delta:
        const cur = q.currentVal ?? getBaseline(id);
        const rolledBackN = cur - sentPayload.delta;
        q.currentVal = rolledBackN;
        if (!activePending && rolledBackN === getBaseline(id)) {
          q.currentVal = undefined;
          setDraft((d) => {
            const s = { ...d };
            delete s[id];
            return s;
          });
        } else {
          setDraft((d) => ({ ...d, [id]: { n: rolledBackN, terkirim: false } }));
        }
      } else {
        // Jika request yang gagal berupa nilai mutlak:
        if (!activePending) {
          q.currentVal = undefined;
          setDraft((d) => {
            const s = { ...d };
            delete s[id];
            return s;
          });
        } else {
          setDraft((d) => ({ ...d, [id]: { n: q.currentVal!, terkirim: false } }));
        }
      }
    }

    // Jika ada mutasi baru yang masuk selama request berjalan, proses berikutnya secara sekuensial
    if (q.pending) {
      void flushMenu(id);
    }
  }

  const flushMenuRef = useRef(flushMenu);
  useEffect(() => {
    flushMenuRef.current = flushMenu;
  });

  // Pindah halaman / unmount sebelum jeda habis: flush pending agar tidak hilang
  useEffect(() => {
    const a = antre.current;
    return () => {
      a.forEach((q, id) => {
        clearTimeout(q.timer);
        // Bila tidak in-flight, flush sekarang.
        // Bila sedang in-flight, promise in-flight yang sedang berjalan akan otomatis mengeksekusi q.pending setelahnya
        if (!q.inFlight && q.pending) {
          void flushMenuRef.current(id);
        }
      });
    };
  }, []);

  function ubahDelta(id: number, delta: number) {
    const q = getQueue(id);
    const baseline = getBaseline(id);
    const cur = q.currentVal ?? baseline;
    const nextN = cur + delta;

    q.currentVal = nextN;
    setDraft((d) => ({ ...d, [id]: { n: nextN, terkirim: false } }));

    // Operasi campuran: bila ada pending mutlak, tambahkan delta ke nilai mutlak tersebut
    if (q.pending?.quota_today !== undefined) {
      q.pending = { quota_today: q.pending.quota_today + delta };
    } else {
      q.pending = { delta: (q.pending?.delta ?? 0) + delta };
    }

    clearTimeout(q.timer);
    q.timer = setTimeout(() => void flushMenuRef.current(id), JEDA);
  }

  function ubahMutlak(id: number, quota: number) {
    const q = getQueue(id);
    q.currentVal = quota;
    setDraft((d) => ({ ...d, [id]: { n: quota, terkirim: false } }));

    // Pengisian nilai mutlak menggantikan/membatalkan pending delta sebelumnya
    q.pending = { quota_today: quota };

    clearTimeout(q.timer);
    q.timer = setTimeout(() => void flushMenuRef.current(id), JEDA);
  }

  function ubah(id: number, ubahan: number | { delta?: number; quota_today?: number }) {
    if (typeof ubahan === "object" && ubahan !== null) {
      if (ubahan.delta !== undefined) ubahDelta(id, ubahan.delta);
      else if (ubahan.quota_today !== undefined) ubahMutlak(id, ubahan.quota_today);
    } else {
      ubahMutlak(id, ubahan);
    }
  }

  /** Terapkan draf kuota ke menu (tersedia dihitung ulang). */
  const dengan = (m: MerchantMenu): MerchantMenu =>
    draft[m.id] === undefined
      ? m
      : { ...m, quota_today: draft[m.id].n, available: draft[m.id].n - m.sold_today - m.held_today };

  return { ubah, ubahDelta, ubahMutlak, dengan };
}
