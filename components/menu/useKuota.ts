"use client";

import { useEffect, useRef, useState } from "react";
import { adjustQuota } from "@/app/actions/menus";
import { panggil } from "@/lib/aksi";
import { toast } from "@/components/ui/Toast";
import type { MerchantMenu } from "@/lib/types";

const JEDA = 500; // tahan tekan stepper mengirim satu permintaan, bukan satu per langkah

/** DB-N3 / DB-E4 / MN-N4: kuota diubah langsung (optimistis), dikirim sebagai quota_today setelah jeda; ditolak -> angka kembali + toast. */
export function useKuota(onBerubah: (m: MerchantMenu) => void, menus: MerchantMenu[]) {
  // `terkirim`: sudah tersimpan di server; draf bertahan sampai `menus` (data server) berganti, bukan saat simpan sukses.
  const [draft, setDraft] = useState<Record<number, { n: number; terkirim: boolean }>>({});
  const [dariMenus, setDariMenus] = useState(menus);
  if (menus !== dariMenus) {
    setDariMenus(menus);
    setDraft((d) => Object.fromEntries(Object.entries(d).filter(([, v]) => !v.terkirim)));
  }
  const antre = useRef(new Map<number, { n: number; t: ReturnType<typeof setTimeout> }>());
  const onBerubahRef = useRef(onBerubah);
  useEffect(() => { onBerubahRef.current = onBerubah; });

  async function simpan(id: number, n: number) {
    antre.current.delete(id);
    const r = await panggil(() => adjustQuota(id, { quota_today: n }));
    const ok = "data" in r;
    if (ok) onBerubahRef.current(r.data);
    else toast({ tone: "danger", message: r.error.message });
    // Hanya ubah draf bila belum ada ketikan yang lebih baru. Sukses: tandai terkirim; gagal: angka kembali.
    setDraft((d) => {
      if (d[id]?.n !== n) return d;
      if (ok) return { ...d, [id]: { n, terkirim: true } };
      const sisa = { ...d };
      delete sisa[id];
      return sisa;
    });
  }
  const simpanRef = useRef(simpan);
  useEffect(() => { simpanRef.current = simpan; });

  // Pindah halaman sebelum jeda habis: kirim sekarang agar perubahan tidak hilang.
  useEffect(() => {
    const a = antre.current;
    return () => a.forEach(({ n, t }, id) => { clearTimeout(t); void simpanRef.current(id, n); });
  }, []);

  function ubah(id: number, n: number) {
    setDraft((d) => ({ ...d, [id]: { n, terkirim: false } }));
    clearTimeout(antre.current.get(id)?.t);
    antre.current.set(id, { n, t: setTimeout(() => void simpan(id, n), JEDA) });
  }

  /** Terapkan draf kuota ke menu (tersedia dihitung ulang). */
  const dengan = (m: MerchantMenu): MerchantMenu =>
    draft[m.id] === undefined ? m : { ...m, quota_today: draft[m.id].n, available: draft[m.id].n - m.sold_today - m.held_today };

  return { ubah, dengan };
}
