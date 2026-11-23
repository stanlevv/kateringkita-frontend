// Komponen QuotaPanel: panel "Kuota hari ini" di dashboard, berisi baris kuota per menu. Dipakai DashboardLive.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { UtensilsCrossed } from "lucide-react";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { sortMenusByStock } from "@/lib/dashboard";
import type { MerchantMenu } from "@/types/menu";
import { QuotaRow } from "@/app/components/menu/QuotaRow";
import { useQuota } from "@/hooks/useQuota";

/**
 * Panel kuota hari ini, diurutkan dari stok paling kritis (habis, menipis, aman). Cara menyimpan kuota (jeda kirim,
 * delta atau angka mutlak, kembali bila ditolak server) ada di hook useQuota.
 * @param props.menus daftar menu dari server
 * @param props.now jam sekarang (ms)
 * @param props.lastSyncedAt waktu sinkron sukses terakhir (dasar "Diperbarui N detik lalu")
 * @param props.onMenuSaved dipanggil dengan menu terbaru setelah kuota tersimpan di server
 * @returns elemen `section`
 */
export function QuotaPanel({
  menus,
  now,
  lastSyncedAt,
  onMenuSaved,
}: {
  menus: MerchantMenu[];
  now: number;
  lastSyncedAt: number;
  onMenuSaved: (menu: MerchantMenu) => void;
}) {
  const { changeQuotaBy, setQuota, withDraft } = useQuota(onMenuSaved, menus);

  // Urutan dari nilai tersimpan agar baris tidak melompat saat sedang diubah.
  const sortedMenus = sortMenusByStock(menus).map(withDraft);

  return (
    <section
      id="panel-kuota"
      tabIndex={-1}
      aria-labelledby="judul-kuota"
      className="rounded-lg border border-line bg-surface p-4 focus-visible:ring-2 focus-visible:ring-focus"
    >
      <h2 id="judul-kuota" className="text-lg font-semibold text-ink">
        Kuota hari ini
      </h2>
      {sortedMenus.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon={UtensilsCrossed}
            title="Belum ada menu aktif"
            body="Tambah menu agar pembeli bisa memesan."
            action={<LinkButton href="/menu/baru">Tambah menu</LinkButton>}
          />
        </div>
      ) : (
        <ul className="mt-1">
          {sortedMenus.map((menu) => (
            <QuotaRow
              key={menu.id}
              menu={menu}
              onQuotaChange={(quota) => setQuota(menu.id, quota)}
              onDelta={(delta) => changeQuotaBy(menu.id, delta)}
            />
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-ink-muted">
        Diperbarui {Math.max(0, Math.floor((now - lastSyncedAt) / 1000))} detik lalu
      </p>
    </section>
  );
}
