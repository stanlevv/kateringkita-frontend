// Komponen ConfirmDialog: dialog konfirmasi (Ya/Batal), opsional dengan pilihan alasan dan isian "Lainnya".
// Dipakai untuk aksi yang perlu dipastikan dulu: tolak pesanan, tutup dapur, aksi admin, dan lainnya.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Field } from "./Field";
import { Textarea } from "./Input";

// Pilihan terakhir yang membuka isian alasan bebas.
const OTHER_REASON = "Lainnya";

// Prop ConfirmDialog (lihat JSDoc ConfirmDialog).
type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone: "danger" | "primary";
  reasons?: string[];
  requireReason?: boolean;
  busy?: boolean;
  onConfirm: (reason?: string) => void;
};

// Isi dialog; dipisah agar state pilihan alasan dibuat ulang setiap kali dialog dibuka.
function ConfirmDialogBody({
  onClose,
  body,
  confirmLabel,
  cancelLabel = "Batal",
  tone,
  reasons,
  requireReason,
  busy,
  onConfirm,
}: Omit<Props, "open" | "title">) {
  // Alasan terpilih; "Lainnya" memakai teks yang diketik. Tombol konfirmasi nonaktif bila alasan wajib tapi kosong.
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const isOther = selected === OTHER_REASON;
  const reason = isOther ? otherText.trim() : (selected ?? undefined);
  const missingReason = !!requireReason && !reason;

  return (
    <>
      <div className="text-ink-muted">{body}</div>
      {reasons && (
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-sm font-medium">Alasan</legend>
          {[...reasons, OTHER_REASON].map((reasonOption) => (
            <label key={reasonOption} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="alasan"
                value={reasonOption}
                checked={selected === reasonOption}
                onChange={() => setSelected(reasonOption)}
                className="size-5 accent-primary"
              />
              {reasonOption}
            </label>
          ))}
        </fieldset>
      )}
      {isOther && (
        <Field label="Tulis alasan" required>
          <Textarea autoFocus value={otherText} onChange={(event) => setOtherText(event.target.value)} />
        </Field>
      )}
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={tone} disabled={missingReason || busy} onClick={() => onConfirm(reason)} className="sm:ml-4">
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}

/**
 * Dialog konfirmasi.
 * @param props.open tampil atau tidak
 * @param props.onClose dipanggil saat Batal, Tutup, atau Esc
 * @param props.title judul dialog
 * @param props.body penjelasan akibat aksi
 * @param props.confirmLabel teks tombol konfirmasi
 * @param props.cancelLabel teks tombol batal (bawaan "Batal")
 * @param props.tone warna tombol konfirmasi: danger atau primary
 * @param props.reasons pilihan alasan baku (opsional); "Lainnya" selalu ditambahkan
 * @param props.requireReason alasan wajib dipilih/diisi
 * @param props.busy nonaktifkan tombol konfirmasi selama memproses
 * @param props.onConfirm dipanggil dengan alasan (bila ada)
 * @returns Dialog
 */
export function ConfirmDialog({ open, onClose, title, ...rest }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <ConfirmDialogBody onClose={onClose} {...rest} />
    </Dialog>
  );
}
