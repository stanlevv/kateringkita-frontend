// Komponen PromoList: kartu voucher dengan status, tombol ubah, aktif/nonaktif, dan hapus. Dipakai /promo (promo
// toko) dan /admin/promo (promo platform). Perubahan dikirim lewat server action setPromoActive, deletePromo, dan
// savePromo (app/actions/promos.ts), atau aksi admin yang dikirim lewat prop.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useState } from "react";
import { EyeOff, Pencil, Plus, Power, TicketPercent, Trash2 } from "lucide-react";
import { deletePromo, setPromoActive } from "@/app/actions/promos";
import { callAction } from "@/lib/action";
import { LoadError } from "@/app/components/LoadError";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Dialog } from "@/app/components/ui/Dialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { toast } from "@/app/components/ui/Toast";
import { formatRupiah, formatDate } from "@/lib/format";
import { PROMO_STATUS, promoStatus, describePromoType } from "@/lib/promo-status";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";
import { PromoForm } from "./PromoForm";

/**
 * Daftar voucher. Hasil aksi disimpan di state lokal dan menang atas data server sampai halaman dimuat ulang, supaya
 * kartu langsung berubah tanpa menunggu data baru. Voucher yang sudah dipakai tidak bisa dihapus, hanya dinonaktifkan.
 * @param props.promos voucher dari backend
 * @param props.loadFailed true = data gagal dimuat (tampil LoadError)
 * @param props.admin mode admin (promo platform)
 * @param props.saveAction penyimpan voucher (bawaan savePromo)
 * @param props.setActiveAction pengubah aktif/nonaktif (bawaan setPromoActive)
 * @returns tombol buat, grid kartu, dialog formulir, dan dialog konfirmasi hapus
 */
export function PromoList({
  promos,
  loadFailed,
  admin,
  saveAction,
  setActiveAction,
}: {
  promos: Promo[];
  loadFailed: boolean;
  /** Mode admin (promo platform): tanpa Hapus, kode tidak bisa diubah, aksi simpan/aktif dari admin. */
  admin?: boolean;
  saveAction?: (id: number | null, input: unknown) => Promise<ActionResult<Promo>>;
  setActiveAction?: (id: number, active: boolean) => Promise<ActionResult<Promo>>;
}) {
  // 1. Perubahan lokal per id (null = dihapus), voucher baru, isi dialog ("new" = buat baru), dan voucher yang akan
  //    dihapus. Jam dibekukan saat tampil supaya status kartu tidak berubah di tengah render.
  const [localChanges, setLocalChanges] = useState<Record<number, Promo | null>>({});
  const [newPromos, setNewPromos] = useState<Promo[]>([]);
  const [form, setForm] = useState<"new" | Promo | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<Promo | null>(null);
  const [now] = useState(() => Date.now());

  // 2. Data gagal dimuat.
  if (loadFailed)
    return (
      <LoadError
        title="Promo belum bisa dimuat"
        body="Terjadi kesalahan saat mengambil daftar promo. Periksa koneksi lalu coba lagi."
      />
    );

  // 3. Daftar tampil: voucher baru di atas, perubahan lokal menimpa data server, yang dihapus dibuang.
  const visiblePromos = [...newPromos, ...promos].flatMap((promo) => {
    const current = promo.id in localChanges ? localChanges[promo.id] : promo;
    return current ? [current] : [];
  });
  const openCreateForm = () => setForm("new");

  // 4. Aktif/nonaktif secara optimistis (tampilan berubah dulu, dikembalikan bila server gagal). Menonaktifkan
  //    memberi toast dengan tombol Batalkan.
  async function setActive(promo: Promo, active: boolean) {
    // 1. Ubah tampilan dulu, lalu kirim ke server.
    const applyLocal = (updated: Promo) => setLocalChanges((previous) => ({ ...previous, [promo.id]: updated }));
    applyLocal({ ...promo, is_active: active });
    const result = await callAction(() => (setActiveAction ?? setPromoActive)(promo.id, active));
    if ("error" in result) {
      // 2. Gagal: kembalikan tampilan.
      applyLocal(promo);
      toast({ tone: "danger", message: result.error.message });
      return;
    }
    toast(
      active
        ? { tone: "success", message: "Promo diaktifkan" }
        : {
            tone: "success",
            message: "Promo dinonaktifkan",
            action: { label: "Batalkan", onClick: () => void setActive({ ...promo, is_active: true }, true) },
          },
    );
  }

  // 5. Hapus voucher (setelah dikonfirmasi di dialog).
  async function removePromo(promo: Promo) {
    const result = await callAction(() => deletePromo(promo.id));
    if ("error" in result) return toast({ tone: "danger", message: result.error.message });
    setLocalChanges((previous) => ({ ...previous, [promo.id]: null }));
    toast({ tone: "success", message: "Promo dihapus" });
  }

  // 6. Hasil formulir: voucher baru masuk ke atas daftar, voucher yang diubah menimpa versi lama.
  function handleSaved(promo: Promo) {
    if (form === "new") setNewPromos((previous) => [promo, ...previous]);
    else setLocalChanges((previous) => ({ ...previous, [promo.id]: promo }));
    setForm(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {visiblePromos.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title="Belum ada promo"
          body="Buat kode promo untuk menarik pembeli"
          action={
            <Button onClick={openCreateForm}>
              <Plus aria-hidden className="size-4" />
              Buat promo
            </Button>
          }
        />
      ) : (
        <>
          <div>
            <Button onClick={openCreateForm}>
              <Plus aria-hidden className="size-4" />
              Buat promo
            </Button>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visiblePromos.map((promo) => {
              const statusBadge = PROMO_STATUS[promoStatus(promo, now)];
              return (
                <li key={promo.id}>
                  <article
                    aria-label={promo.code}
                    className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-lg font-semibold text-ink">{promo.code}</p>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Badge tone={statusBadge.tone} icon={statusBadge.icon}>
                          {statusBadge.label}
                        </Badge>
                        {promo.is_public === false && (
                          <Badge tone="neutral" icon={EyeOff}>
                            Tersembunyi
                          </Badge>
                        )}
                      </div>
                    </div>
                    {promo.description && <p className="text-ink-muted">{promo.description}</p>}
                    <p className="font-medium text-ink">{describePromoType(promo)}</p>
                    <dl className="grid gap-1 text-sm text-ink-muted">
                      <div>
                        <dt className="sr-only">Min belanja</dt>
                        <dd>
                          {promo.min_subtotal > 0
                            ? `Min. belanja ${formatRupiah(promo.min_subtotal)}`
                            : "Tanpa minimal belanja"}
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">Periode</dt>
                        <dd>
                          {formatDate(promo.starts_at)} – {formatDate(promo.ends_at)}
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">Pemakaian</dt>
                        <dd className="font-mono">
                          {promo.quota !== null ? `${promo.used_count}/${promo.quota}` : promo.used_count} terpakai
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      <Button variant="secondary" aria-label={`Ubah ${promo.code}`} onClick={() => setForm(promo)}>
                        <Pencil aria-hidden className="size-4" />
                        Ubah
                      </Button>
                      <Button
                        variant="secondary"
                        aria-label={`${promo.is_active ? "Nonaktifkan" : "Aktifkan"} ${promo.code}`}
                        onClick={() => void setActive(promo, !promo.is_active)}
                      >
                        <Power aria-hidden className="size-4" />
                        {promo.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      {admin ? null : promo.used_count === 0 ? (
                        <Button
                          variant="ghost"
                          className="ml-auto text-danger"
                          aria-label={`Hapus ${promo.code}`}
                          onClick={() => setPromoToDelete(promo)}
                        >
                          <Trash2 aria-hidden className="size-4" />
                          Hapus
                        </Button>
                      ) : (
                        <p className="text-sm text-ink-muted">Sudah dipakai — nonaktifkan saja</p>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        title={form === "new" ? "Buat promo" : "Ubah promo"}
        className="max-h-[90dvh] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto"
      >
        <PromoForm
          promo={form === "new" ? null : form}
          saveAction={saveAction}
          admin={admin}
          onSaved={handleSaved}
          onClose={() => setForm(null)}
        />
      </Dialog>
      <ConfirmDialog
        open={!!promoToDelete}
        onClose={() => setPromoToDelete(null)}
        tone="danger"
        title="Hapus promo?"
        body={`Kode ${promoToDelete?.code ?? ""} akan dihapus dan tidak bisa dipakai lagi.`}
        confirmLabel="Hapus promo"
        onConfirm={() => {
          const promo = promoToDelete!;
          setPromoToDelete(null);
          void removePromo(promo);
        }}
      />
    </div>
  );
}
