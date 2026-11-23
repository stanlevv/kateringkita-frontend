// Komponen TemplateEditor: penyunting templat WhatsApp di /template-wa. Kata kunci seperti {nama} dan {kode} diganti
// data pesanan saat pesan dikirim (lib/wa-template.ts). Templat disimpan lewat server action saveProfile
// (field wa_template). Templat WhatsApp = pola teks pesan yang sama untuk semua pesanan.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useEffect, useRef, useState } from "react";
import { saveProfile } from "@/app/actions/profile";
import { callAction } from "@/lib/action";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { cx, focusRing } from "@/app/components/ui/cx";
import { Field } from "@/app/components/ui/Field";
import { Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { useUnsavedGuard } from "@/hooks/useUnsavedGuard";
import type { MerchantOrder } from "@/types/order";
import {
  validateTemplate,
  templateValuesFromOrder,
  MAX_TEMPLATE_LENGTH,
  PLACEHOLDER,
  renderTemplate,
  TEMPLATE_BAWAAN,
} from "@/lib/wa-template";
import { ChatPreview } from "./ChatPreview";

/**
 * Penyunting templat: tombol kata kunci (disisipkan di posisi kursor), isian templat, pratinjau langsung, kembalikan ke
 * bawaan, dan penjaga perubahan belum disimpan.
 * @param props.merchantName nama toko untuk pratinjau
 * @param props.template templat tersimpan, null = memakai templat bawaan
 * @param props.order pesanan contoh untuk pratinjau, null bila toko belum punya pesanan
 * @returns penyunting, pratinjau, dan dialog konfirmasi
 */
export function TemplateEditor({
  merchantName,
  template,
  order,
}: {
  merchantName: string;
  template: string | null;
  order: MerchantOrder | null;
}) {
  // 1. Templat tersimpan (acuan "ada perubahan"), isi sekarang, status simpan, dan posisi kursor yang tertunda.
  const [savedTemplate, setSavedTemplate] = useState(template ?? TEMPLATE_BAWAAN);
  const [text, setText] = useState(savedTemplate);
  const [saving, setSaving] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const pendingCursor = useRef<number | null>(null);

  // 2. Ada perubahan? Lalu validasi isi templat.
  const dirty = text !== savedTemplate;
  const guard = useUnsavedGuard(dirty);
  const templateError = validateTemplate(text);

  // 3. Kursor dikembalikan setelah React menulis ulang isi textarea.
  useEffect(() => {
    if (pendingCursor.current === null) return;
    const element = textarea.current;
    element?.focus();
    element?.setSelectionRange(pendingCursor.current, pendingCursor.current);
    pendingCursor.current = null;
  }, [text]);

  // 4. Sisipkan kata kunci menggantikan teks yang disorot, lalu taruh kursor setelahnya.
  function insertPlaceholder(placeholder: string) {
    const element = textarea.current;
    const selectionStart = element?.selectionStart ?? text.length;
    const selectionEnd = element?.selectionEnd ?? text.length;
    pendingCursor.current = selectionStart + placeholder.length;
    setText(text.slice(0, selectionStart) + placeholder + text.slice(selectionEnd));
  }

  // 5. Simpan; templat yang masih galat tidak dikirim.
  async function save() {
    if (templateError || saving) return;
    setSaving(true);
    const result = await callAction(() => saveProfile({ wa_template: text }));
    setSaving(false);
    if ("error" in result)
      return toast({ tone: "danger", message: result.error.fields?.wa_template?.[0] ?? result.error.message });
    setSavedTemplate(text);
    toast({ tone: "success", message: "Templat disimpan" });
  }

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-ink">Kata kunci</h2>
            <p className="text-sm text-ink-muted">
              Klik untuk menyisipkan di posisi kursor. Kata kunci diganti data pesanan saat pesan dikirim.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {PLACEHOLDER.map((item) => (
                <li key={item.code}>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder(item.code)}
                    className={cx(
                      "flex min-h-11 w-full flex-col items-start justify-center rounded-md border border-line-strong bg-surface px-3 py-1 text-left hover:bg-subtle",
                      focusRing,
                    )}
                  >
                    <span className="font-mono text-sm font-semibold text-ink">{item.code}</span>
                    <span className="text-sm text-ink-muted">{item.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <Field
            label="Isi templat"
            id="wa-template"
            help={`${text.length.toLocaleString("id-ID")}/${MAX_TEMPLATE_LENGTH.toLocaleString("id-ID")} karakter`}
            error={templateError ?? undefined}
          >
            <Textarea
              ref={textarea}
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={12}
              className="font-mono"
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setConfirmResetOpen(true)}>
              Kembalikan ke bawaan
            </Button>
            {dirty && (
              <div className="flex flex-wrap items-center gap-3">
                {templateError && (
                  <p id="wa-simpan-info" className="text-sm text-danger">
                    Perbaiki isi templat dulu sebelum menyimpan.
                  </p>
                )}
                <Button
                  loading={saving}
                  loadingText="Menyimpan…"
                  aria-disabled={templateError ? true : undefined}
                  aria-describedby={templateError ? "wa-simpan-info" : undefined}
                  className={templateError ? "opacity-50" : undefined}
                  onClick={() => void save()}
                >
                  Simpan templat
                </Button>
              </div>
            )}
          </div>
        </div>

        <ChatPreview
          merchantName={merchantName}
          text={order ? renderTemplate(text, templateValuesFromOrder(order)) : text}
          note={order ? `Contoh dari pesanan ${order.code}.` : "Pratinjau terisi data pesanan setelah ada pesanan."}
        />
      </div>

      <ConfirmDialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title="Kembalikan ke bawaan?"
        body="Isi templat diganti dengan templat bawaan. Perubahan baru tersimpan setelah Simpan templat ditekan."
        confirmLabel="Kembalikan"
        tone="primary"
        onConfirm={() => {
          setText(TEMPLATE_BAWAAN);
          setConfirmResetOpen(false);
        }}
      />
      <ConfirmDialog
        open={guard.open}
        onClose={guard.cancel}
        title="Buang perubahan?"
        body="Perubahan pada templat ini belum disimpan."
        confirmLabel="Buang perubahan"
        cancelLabel="Tetap di sini"
        tone="danger"
        onConfirm={guard.confirm}
      />
    </>
  );
}
