"use client";

import { UtensilsCrossed } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { urutKuota } from "@/lib/dashboard";
import type { MerchantMenu } from "@/lib/types";
import { QuotaRow } from "./QuotaRow";
import { useKuota } from "./useKuota";

/** DB-N3 / DB-E4: perilaku ubah kuota ada di useKuota. */
/** `terakhir`: waktu klien penyegaran sukses terakhir (dasar "Diperbarui N detik lalu"). */
export function QuotaPanel({ menus, sekarang, terakhir, onBerubah }: { menus: MerchantMenu[]; sekarang: number; terakhir: number; onBerubah: (m: MerchantMenu) => void }) {
  const { ubah, dengan } = useKuota(onBerubah, menus);

  // Urutan dari nilai tersimpan agar baris tidak melompat saat sedang diubah.
  const daftar = urutKuota(menus).map(dengan);

  return (
    <section id="panel-kuota" tabIndex={-1} aria-labelledby="judul-kuota" className="rounded-lg border border-line bg-surface p-4 focus-visible:ring-2 focus-visible:ring-focus">
      <h2 id="judul-kuota" className="text-lg font-semibold text-ink">Kuota hari ini</h2>
      {daftar.length === 0 ? (
        <div className="mt-3">
          <EmptyState icon={UtensilsCrossed} title="Belum ada menu aktif" body="Tambah menu agar pembeli bisa memesan."
            action={<LinkButton href="/menu/baru">Tambah menu</LinkButton>} />
        </div>
      ) : (
        <ul className="mt-1">
          {daftar.map((m) => <QuotaRow key={m.id} menu={m} onUbah={(n) => ubah(m.id, n)} />)}
        </ul>
      )}
      <p className="mt-3 text-sm text-ink-muted">Diperbarui {Math.max(0, Math.floor((sekarang - terakhir) / 1000))} detik lalu</p>
    </section>
  );
}
