"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { simpanPemeliharaan } from "@/app/actions/admin/promos";
import { Banner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import type { Maintenance } from "@/types/meta";

/** F27: saklar mode pemeliharaan. Saat aktif penjual & pembeli tidak bisa memakai KateringKita; panel admin tetap jalan. */
export function PemeliharaanForm({ nilai }: { nilai: Maintenance }) {
  const router = useRouter();
  const [pesan, setPesan] = useState(nilai.pesan ?? "");
  const [galat, setGalat] = useState<string>();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);

  async function simpan(aktif: boolean) {
    if (pesan.trim().length > 200) return setGalat("Pesan maksimal 200 karakter.");
    setMenyimpan(true);
    const r = await callAction(() => simpanPemeliharaan(aktif, pesan));
    setMenyimpan(false);
    setKonfirmasi(false);
    if ("error" in r) return void toast({ tone: "danger", message: r.error.message });
    toast({ tone: "success", message: aktif ? "Mode pemeliharaan dinyalakan" : "Mode pemeliharaan dimatikan" });
    router.refresh();
  }

  return (
    <section
      aria-label="Mode pemeliharaan"
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 lg:col-span-2"
    >
      <h2 className="text-lg font-semibold text-ink">Mode pemeliharaan</h2>
      <p className="text-ink-muted">
        Saat aktif, penjual dan pembeli tidak bisa memakai KateringKita dan melihat pesan di bawah. Panel admin dan
        pembayaran yang sedang berjalan tetap diproses.
      </p>
      {nilai.aktif && <Banner tone="warning">Mode pemeliharaan sedang aktif.</Banner>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:flex-1">
          <Field
            label="Pesan untuk pengguna"
            id="pemeliharaan-pesan"
            help="Opsional, maksimal 200 karakter. Kosongkan untuk memakai pesan bawaan."
            error={galat}
          >
            <Input
              value={pesan}
              maxLength={200}
              onChange={(e) => {
                setGalat(undefined);
                setPesan(e.target.value);
              }}
            />
          </Field>
        </div>
        {nilai.aktif ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => simpan(true)} disabled={menyimpan}>
              Simpan pesan
            </Button>
            <Button onClick={() => simpan(false)} loading={menyimpan} loadingText="Menyimpan…">
              Matikan pemeliharaan
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setKonfirmasi(true)}>
            Nyalakan pemeliharaan
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={konfirmasi}
        onClose={() => setKonfirmasi(false)}
        title="Nyalakan mode pemeliharaan?"
        body="Semua penjual dan pembeli langsung tidak bisa memesan atau mengelola toko sampai mode ini dimatikan."
        confirmLabel="Ya, nyalakan"
        tone="danger"
        busy={menyimpan}
        onConfirm={() => simpan(true)}
      />
    </section>
  );
}
