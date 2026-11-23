"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveMaintenance } from "@/app/actions/admin/promos";
import { Banner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import type { Maintenance } from "@/types/meta";

/** F27: saklar mode pemeliharaan. Saat aktif penjual & pembeli tidak bisa memakai KateringKita; panel admin tetap jalan. */
export function MaintenanceForm({ maintenance }: { maintenance: Maintenance }) {
  const router = useRouter();
  const [message, setMessage] = useState(maintenance.pesan ?? "");
  const [error, setError] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(active: boolean) {
    if (message.trim().length > 200) return setError("Pesan maksimal 200 karakter.");
    setSaving(true);
    const result = await callAction(() => saveMaintenance(active, message));
    setSaving(false);
    setConfirmOpen(false);
    if ("error" in result) return void toast({ tone: "danger", message: result.error.message });
    toast({ tone: "success", message: active ? "Mode pemeliharaan dinyalakan" : "Mode pemeliharaan dimatikan" });
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
      {maintenance.aktif && <Banner tone="warning">Mode pemeliharaan sedang aktif.</Banner>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:flex-1">
          <Field
            label="Pesan untuk pengguna"
            id="pemeliharaan-pesan"
            help="Opsional, maksimal 200 karakter. Kosongkan untuk memakai pesan bawaan."
            error={error}
          >
            <Input
              value={message}
              maxLength={200}
              onChange={(event) => {
                setError(undefined);
                setMessage(event.target.value);
              }}
            />
          </Field>
        </div>
        {maintenance.aktif ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => save(true)} disabled={saving}>
              Simpan pesan
            </Button>
            <Button onClick={() => save(false)} loading={saving} loadingText="Menyimpan…">
              Matikan pemeliharaan
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Nyalakan pemeliharaan
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Nyalakan mode pemeliharaan?"
        body="Semua penjual dan pembeli langsung tidak bisa memesan atau mengelola toko sampai mode ini dimatikan."
        confirmLabel="Ya, nyalakan"
        tone="danger"
        busy={saving}
        onConfirm={() => save(true)}
      />
    </section>
  );
}
