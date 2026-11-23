"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, EyeOff, Flag, Star, X } from "lucide-react";
import { deleteMenuPhoto, moderate } from "@/app/actions/admin/moderation";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { Dialog } from "@/app/components/ui/Dialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Field } from "@/app/components/ui/Field";
import { Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { formatRupiah, formatDate } from "@/lib/format";
import type { ModerationAction, ModerationMenu, ModerationReview } from "@/types/admin";

// hide/takedown: dialog alasan; unhide/restore: konfirmasi (AUD-35: tidak jalan dengan sekali klik)
const ACTION_TEXTS: Record<
  ModerationAction,
  { label: string; title: string; successMessage: string; body?: string; confirmLabel?: string }
> = {
  hide: { label: "Sembunyikan", title: "Sembunyikan ulasan", successMessage: "Ulasan disembunyikan." },
  unhide: {
    label: "Tampilkan lagi",
    title: "Tampilkan lagi ulasan?",
    successMessage: "Ulasan ditampilkan lagi.",
    body: "Ulasan ini tampil lagi untuk pembeli dan ikut dihitung di rating.",
    confirmLabel: "Ya, tampilkan",
  },
  takedown: { label: "Turunkan", title: "Turunkan menu", successMessage: "Menu diturunkan dari katalog." },
  restore: {
    label: "Pulihkan",
    title: "Pulihkan menu?",
    successMessage: "Menu dipulihkan. Penjual bisa mengaktifkannya lagi.",
    body: "Penjual bisa mengaktifkan menu ini lagi di katalog.",
    confirmLabel: "Ya, pulihkan",
  },
};

function ModerationStatus({
  moderated,
  reason,
  label,
}: {
  moderated: boolean;
  reason: string | null;
  label: [string, string];
}) {
  return moderated ? (
    <span className="flex flex-col gap-1">
      <Badge tone="danger" icon={EyeOff}>
        {label[1]}
      </Badge>
      {reason && <span className="text-sm text-ink-muted">{reason}</span>}
    </span>
  ) : (
    <Badge tone="success" icon={CheckCircle2}>
      {label[0]}
    </Badge>
  );
}

/** Foto utama lalu foto tambahan; klik membuka ukuran penuh, tombol × menghapus satu foto (dengan alasan). */
function MenuPhotos({ menu, onDelete }: { menu: ModerationMenu; onDelete: (url: string) => void }) {
  const photos = [menu.image_url, ...(menu.gallery ?? [])].filter((url): url is string => !!url);
  if (!photos.length) return <span className="text-sm text-ink-muted">Tanpa foto</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {photos.map((url, i) => (
        <span key={url} className="relative">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buka foto ${i + 1} ${menu.name}${i === 0 && menu.image_url ? " (utama)" : ""}`}
            className="relative block size-10 overflow-hidden rounded-sm bg-subtle ring-offset-2 focus-visible:ring-2 focus-visible:ring-info"
          >
            <Image src={url} alt="" fill unoptimized sizes="40px" className="object-cover" />
          </a>
          <button
            type="button"
            onClick={() => onDelete(url)}
            aria-label={`Hapus foto ${i + 1} ${menu.name}`}
            className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-line bg-surface text-danger shadow-sm hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
          >
            <X aria-hidden className="size-3" />
          </button>
        </span>
      ))}
    </span>
  );
}

/** F19 — daftar ulasan atau menu dengan aksi moderasi; alasan wajib untuk sembunyikan/turunkan. */
export function ModerationTable(
  props: { kind: "ulasan"; rows: ModerationReview[] } | { kind: "menu"; rows: ModerationMenu[] },
) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ id: number; action: ModerationAction } | null>(null);
  const [restoring, setRestoring] = useState<{ id: number; action: ModerationAction } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{ id: number; url: string } | null>(null);

  async function deletePhoto(id: number, url: string, reasonText: string) {
    if (busy) return;
    setBusy(true);
    const result = await callAction(() => deleteMenuPhoto(id, url, reasonText));
    setBusy(false);
    if ("error" in result) return toast({ tone: "danger", message: result.error.message });
    setPhotoToDelete(null);
    setReason("");
    toast({ tone: "success", message: "Foto dihapus dari menu." });
    router.refresh();
  }

  async function submit(id: number, action: ModerationAction, reasonText?: string) {
    if (busy) return;
    setBusy(true);
    const result = await callAction(() => moderate(id, action, reasonText));
    setBusy(false);
    if ("error" in result) return toast({ tone: "danger", message: result.error.message });
    setDialog(null);
    setRestoring(null);
    setReason("");
    toast({ tone: "success", message: ACTION_TEXTS[action].successMessage });
    router.refresh();
  }

  const actionButton = (id: number, action: ModerationAction) => (
    <Button
      variant={action === "hide" || action === "takedown" ? "danger" : "secondary"}
      disabled={busy}
      onClick={() =>
        action === "hide" || action === "takedown" ? setDialog({ id, action }) : setRestoring({ id, action })
      }
    >
      {ACTION_TEXTS[action].label}
    </Button>
  );

  if (props.rows.length === 0) {
    return <EmptyState icon={Flag} title="Tidak ada data" body="Belum ada data yang cocok dengan filter ini." />;
  }

  const table =
    props.kind === "ulasan" ? (
      <DataTable<ModerationReview>
        caption="Ulasan pembeli"
        rows={props.rows}
        rowKey={(review) => String(review.id)}
        columns={
          [
            {
              key: "menu",
              header: "Menu",
              cell: (review) => (
                <span className="flex flex-col">
                  <span className="font-medium">{review.menu.name}</span>
                  <span className="text-sm text-ink-muted">{review.merchant.business_name}</span>
                </span>
              ),
            },
            {
              key: "rating",
              header: "Rating",
              cell: (review) => (
                <span className="inline-flex items-center gap-1">
                  <Star aria-hidden className="size-4" />
                  {review.rating}
                </span>
              ),
            },
            { key: "komentar", header: "Komentar", wrap: true, cell: (review) => review.comment ?? "—" },
            {
              key: "pembeli",
              header: "Pembeli",
              cell: (review) => (
                <span className="flex flex-col">
                  <span>{review.customer_name}</span>
                  <span className="font-mono text-sm text-ink-muted">{review.order_code}</span>
                </span>
              ),
            },
            { key: "tanggal", header: "Tanggal", cell: (review) => formatDate(review.created_at) },
            {
              key: "status",
              header: "Status",
              cell: (review) => (
                <ModerationStatus
                  moderated={review.hidden}
                  reason={review.hidden_reason}
                  label={["Tampil", "Disembunyikan"]}
                />
              ),
            },
            {
              key: "aksi",
              header: "Aksi",
              cell: (review) => actionButton(review.id, review.hidden ? "unhide" : "hide"),
            },
          ] satisfies Column<ModerationReview>[]
        }
      />
    ) : (
      <DataTable<ModerationMenu>
        caption="Menu"
        rows={props.rows}
        rowKey={(menu) => String(menu.id)}
        columns={
          [
            { key: "menu", header: "Menu", cell: (menu) => <span className="font-medium">{menu.name}</span> },
            {
              key: "foto",
              header: "Foto",
              cell: (menu) => (
                <MenuPhotos
                  menu={menu}
                  onDelete={(url) => {
                    setReason("");
                    setPhotoToDelete({ id: menu.id, url });
                  }}
                />
              ),
            },
            { key: "toko", header: "Toko", cell: (menu) => menu.merchant.business_name },
            { key: "harga", header: "Harga", align: "right", cell: (menu) => formatRupiah(menu.price) },
            { key: "aktif", header: "Dijual", cell: (menu) => (menu.is_active ? "Ya" : "Tidak") },
            {
              key: "status",
              header: "Status",
              cell: (menu) => (
                <ModerationStatus
                  moderated={menu.moderated}
                  reason={menu.moderation_reason}
                  label={["Normal", "Diturunkan"]}
                />
              ),
            },
            {
              key: "aksi",
              header: "Aksi",
              cell: (menu) => actionButton(menu.id, menu.moderated ? "restore" : "takedown"),
            },
          ] satisfies Column<ModerationMenu>[]
        }
      />
    );

  return (
    <>
      {table}
      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog ? ACTION_TEXTS[dialog.action].title : ""}
      >
        <Field label="Alasan" required help={`${reason.length}/500`}>
          <Textarea autoFocus value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
        </Field>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDialog(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={!reason.trim() || busy}
            onClick={() => dialog && submit(dialog.id, dialog.action, reason.trim())}
          >
            {dialog ? ACTION_TEXTS[dialog.action].label : ""}
          </Button>
        </div>
      </Dialog>
      <Dialog open={photoToDelete !== null} onClose={() => setPhotoToDelete(null)} title="Hapus foto ini?">
        {photoToDelete && (
          <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-md bg-subtle">
            <Image
              src={photoToDelete.url}
              alt="Foto yang akan dihapus"
              fill
              unoptimized
              sizes="320px"
              className="object-contain"
            />
          </div>
        )}
        <p className="text-sm text-ink-muted">
          Menu tetap dijual. Bila ini foto utama, foto tambahan pertama menjadi foto utama.
        </p>
        <Field label="Alasan" required help={`${reason.length}/500`}>
          <Textarea autoFocus value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
        </Field>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setPhotoToDelete(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={!reason.trim() || busy}
            onClick={() => photoToDelete && void deletePhoto(photoToDelete.id, photoToDelete.url, reason.trim())}
          >
            Hapus foto
          </Button>
        </div>
      </Dialog>
      <ConfirmDialog
        open={restoring !== null}
        onClose={() => setRestoring(null)}
        tone="primary"
        busy={busy}
        title={restoring ? ACTION_TEXTS[restoring.action].title : ""}
        body={restoring ? ACTION_TEXTS[restoring.action].body : ""}
        confirmLabel={restoring ? (ACTION_TEXTS[restoring.action].confirmLabel ?? "") : ""}
        onConfirm={() => restoring && void submit(restoring.id, restoring.action)}
      />
    </>
  );
}
