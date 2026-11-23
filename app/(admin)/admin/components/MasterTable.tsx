"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, CircleCheck, Database, PowerOff } from "lucide-react";
import { setMasterActive, swapSortOrder } from "@/app/actions/admin/master";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { Dialog } from "@/app/components/ui/Dialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { IconButton } from "@/app/components/ui/IconButton";
import { Tabs } from "@/app/components/ui/Tabs";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { MASTER_TABS } from "@/services/admin-master.service";
import type { MasterItem } from "@/types/admin";
import { buildUrl } from "@/lib/url";
import { MasterForm } from "./MasterForm";

/** A-01…A-03 — data master per tab (tab di URL). Titik temu urut nama; kategori & jenis usaha bisa dinaik-turunkan. */
export function MasterTable({ tabId, rows }: { tabId: string; rows: MasterItem[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const tab = MASTER_TABS.find((masterTab) => masterTab.id === tabId) ?? MASTER_TABS[0];
  const [form, setForm] = useState<"new" | MasterItem | null>(null);
  const [deactivating, setDeactivating] = useState<MasterItem | null>(null);
  const [busy, setBusy] = useState(false);

  async function setActive(item: MasterItem, active: boolean) {
    setBusy(true);
    const result = await callAction(() => setMasterActive(tab.kind, item.id, active));
    setBusy(false);
    setDeactivating(null);
    if ("error" in result) return toast({ tone: "danger", message: result.error.message }); // 409: nama toko ikut di pesan
    toast({ tone: "success", message: active ? "Diaktifkan" : "Dinonaktifkan" });
    router.refresh();
  }

  async function move(index: number, direction: -1 | 1) {
    const current = rows[index],
      neighbor = rows[index + direction];
    let currentOrder = current.sort_order ?? 0,
      neighborOrder = neighbor.sort_order ?? 0;
    // Nilai kembar: tak ada yang bisa ditukar, jadi pakai peringkat daftar (1-based) agar urutan pasti berubah.
    if (currentOrder === neighborOrder) {
      const lowerIndex = Math.min(index, index + direction);
      neighborOrder = lowerIndex + (direction < 0 ? 1 : 2);
      currentOrder = lowerIndex + (direction < 0 ? 2 : 1);
    } // sb = nilai baru item ini
    setBusy(true);
    const result = await callAction(() =>
      swapSortOrder(
        tab.kind,
        { id: current.id, sort_order: currentOrder },
        { id: neighbor.id, sort_order: neighborOrder },
      ),
    );
    setBusy(false);
    if ("error" in result) return toast({ tone: "danger", message: `Urutan belum berubah. ${result.error.message}` });
    router.refresh();
  }

  const columns: Column<MasterItem>[] = [
    { key: "name", header: "Nama", cell: (item) => <span className="font-semibold">{item.name}</span> },
    ...(tab.extraField
      ? [
          {
            key: tab.extraField,
            header: tab.extraFieldLabel!,
            wrap: true,
            cell: (item: MasterItem) => item[tab.extraField!] || "-",
          },
        ]
      : []),
    {
      key: "status",
      header: "Status",
      cell: (item) =>
        item.is_active ? (
          <Badge tone="success" icon={CircleCheck}>
            Aktif
          </Badge>
        ) : (
          <Badge tone="neutral" icon={PowerOff}>
            Nonaktif
          </Badge>
        ),
    },
    {
      key: "aksi",
      header: "Aksi",
      cell: (item) => {
        const index = rows.indexOf(item);
        return (
          <div className="flex items-center gap-2">
            {tab.sortable && (
              <>
                <IconButton
                  icon={ArrowUp}
                  label={`Naikkan ${item.name}`}
                  disabled={busy || index === 0}
                  onClick={() => void move(index, -1)}
                />
                <IconButton
                  icon={ArrowDown}
                  label={`Turunkan ${item.name}`}
                  disabled={busy || index === rows.length - 1}
                  onClick={() => void move(index, 1)}
                />
              </>
            )}
            <Button variant="secondary" aria-label={`Ubah ${item.name}`} onClick={() => setForm(item)}>
              Ubah
            </Button>
            {item.is_active ? (
              <Button variant="secondary" aria-label={`Nonaktifkan ${item.name}`} onClick={() => setDeactivating(item)}>
                Nonaktifkan
              </Button>
            ) : (
              <Button
                variant="secondary"
                aria-label={`Aktifkan ${item.name}`}
                disabled={busy}
                onClick={() => void setActive(item, true)}
              >
                Aktifkan
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const addButton = <Button onClick={() => setForm("new")}>Tambah {tab.unitName}</Button>;
  return (
    <div className="flex flex-col gap-4">
      <Tabs
        label="Jenis data master"
        tabs={MASTER_TABS.map((masterTab) => ({ id: masterTab.id, label: masterTab.label }))}
        value={tab.id}
        onChange={(id) =>
          router.replace(buildUrl(path, params.toString(), { tab: id }, [MASTER_TABS[0].id]), { scroll: false })
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Database}
          title={`Belum ada ${tab.unitName}`}
          body="Tambahkan data pertama agar bisa dipilih penjual."
          action={addButton}
        />
      ) : (
        <>
          <div>{addButton}</div>
          <DataTable caption={tab.label} columns={columns} rows={rows} rowKey={(item) => String(item.id)} />
        </>
      )}
      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        title={form === "new" ? `Tambah ${tab.unitName}` : `Ubah ${tab.unitName}`}
      >
        <MasterForm
          key={form === "new" || form === null ? "new" : form.id}
          tab={tab}
          item={form === "new" ? null : form}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            router.refresh();
          }}
        />
      </Dialog>
      <ConfirmDialog
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        tone="danger"
        busy={busy}
        title={`Nonaktifkan ${tab.unitName}?`}
        body={`${deactivating?.name ?? ""} tidak bisa dipilih lagi. Data yang sudah memakainya tidak berubah.`}
        confirmLabel="Nonaktifkan"
        onConfirm={() => void setActive(deactivating!, false)}
      />
    </div>
  );
}
