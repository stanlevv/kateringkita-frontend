"use client";

import { useState, type FormEvent } from "react";
import { Download, Printer, RefreshCw } from "lucide-react";
import { callAction } from "@/lib/action";
import { setDineIn, createTable, updateTable } from "@/app/actions/table";
import { createTableQrImage, TableQr } from "@/app/components/table/TableQr";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { cx, focusRing } from "@/app/components/ui/cx";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { Switch } from "@/app/components/ui/Switch";
import { toast } from "@/app/components/ui/Toast";
import type { Table } from "@/types/table";

async function downloadQr(table: Table) {
  const link = document.createElement("a");
  link.href = await createTableQrImage(table.token, 1024);
  link.download = `qr-meja-${table.label}.png`;
  link.click();
}

export function TableOrderSettings({
  initialEnabled,
  initialTables,
}: {
  initialEnabled: boolean;
  initialTables: Table[] | null;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [tables, setTables] = useState<Table[]>(initialTables ?? []);
  const [label, setLabel] = useState("");
  const [labelError, setLabelError] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [tableToRegenerate, setTableToRegenerate] = useState<Table | null>(null);

  async function toggleDineIn(nextEnabled: boolean) {
    setEnabled(nextEnabled);
    const result = await callAction(() => setDineIn(nextEnabled));
    if ("error" in result) {
      setEnabled(!nextEnabled);
      toast({ tone: "danger", message: result.error.message });
      return;
    }
    toast({ tone: "success", message: nextEnabled ? "Pesan dari meja aktif" : "Pesan dari meja dimatikan" });
  }

  async function addTable(event: FormEvent) {
    event.preventDefault();
    setAdding(true);
    const result = await callAction(() => createTable(label));
    setAdding(false);
    if ("error" in result) {
      setLabelError(result.error.fields?.label?.[0] ?? result.error.message);
      return;
    }
    setTables((previousTables) => [...previousTables, result.data]);
    setLabel("");
    setLabelError(undefined);
  }

  async function changeTable(table: Table, input: { is_active?: boolean; ganti_token?: true }) {
    const result = await callAction(() => updateTable(table.id, input));
    if ("error" in result) {
      toast({ tone: "danger", message: result.error.message });
      return;
    }
    setTables((previousTables) =>
      previousTables.map((existing) => (existing.id === table.id ? result.data : existing)),
    );
    if (input.ganti_token) toast({ tone: "success", message: `QR Meja ${table.label} diganti. Cetak ulang QR-nya.` });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-ink">Terima pesanan dari meja</p>
          <p className="text-sm text-ink-muted">
            Pelanggan scan QR di meja, memilih menu, lalu bayar online (QRIS, e-wallet, atau VA) tanpa membuat akun.
            Pesanan masuk ke antrean dengan label meja dan otomatis diterima setelah lunas.
          </p>
        </div>
        <Switch checked={enabled} onChange={toggleDineIn} label="Terima pesanan dari meja" />
      </div>
      {!enabled && (
        <p className="rounded-md bg-subtle px-3 py-2 text-sm text-ink-muted">
          Selama sakelar mati, semua QR meja menampilkan pesan tidak aktif.
        </p>
      )}

      {initialTables === null ? (
        <p className="text-sm text-danger">Daftar meja gagal dimuat. Muat ulang halaman.</p>
      ) : (
        <>
          <form onSubmit={addTable} noValidate className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <Field
                label="Nama meja"
                id="meja-label"
                help="Contoh: 1, 2, Teras A. Tiap meja mendapat QR sendiri."
                error={labelError}
              >
                <Input value={label} maxLength={30} onChange={(event) => setLabel(event.target.value)} />
              </Field>
            </div>
            <Button type="submit" loading={adding} loadingText="Menambah…" disabled={!label.trim()}>
              Tambah meja
            </Button>
            {tables.length > 0 && (
              <a
                href="/cetak-qr"
                target="_blank"
                rel="noopener"
                className={cx(
                  "inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-subtle",
                  focusRing,
                )}
              >
                <Printer aria-hidden className="size-4" />
                Cetak semua QR
              </a>
            )}
          </form>

          {tables.length === 0 ? (
            <p className="text-sm text-ink-muted">Belum ada meja. Tambahkan meja pertama untuk mendapatkan QR-nya.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tables.map((table) => (
                <li
                  key={table.id}
                  className={cx(
                    "flex flex-col items-center gap-3 rounded-lg border border-line p-4",
                    !table.is_active && "opacity-60",
                  )}
                >
                  <TableQr table={table} />
                  <p className="font-display text-lg font-semibold text-ink">
                    Meja {table.label}
                    {!table.is_active && <span className="ml-2 text-sm font-medium text-ink-muted">(nonaktif)</span>}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="secondary" onClick={() => downloadQr(table)}>
                      <Download aria-hidden className="size-4" />
                      Unduh
                    </Button>
                    <Button variant="secondary" onClick={() => setTableToRegenerate(table)}>
                      <RefreshCw aria-hidden className="size-4" />
                      Ganti QR
                    </Button>
                    <Button variant="ghost" onClick={() => changeTable(table, { is_active: !table.is_active })}>
                      {table.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!tableToRegenerate}
        onClose={() => setTableToRegenerate(null)}
        title={`Ganti QR Meja ${tableToRegenerate?.label ?? ""}?`}
        body="QR lama langsung tidak berlaku. Cetak dan tempel QR yang baru di meja."
        confirmLabel="Ganti QR"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={async () => {
          const table = tableToRegenerate;
          setTableToRegenerate(null);
          if (table) await changeTable(table, { ganti_token: true });
        }}
      />
    </div>
  );
}
