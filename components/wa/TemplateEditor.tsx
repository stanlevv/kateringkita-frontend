"use client";

import { useEffect, useRef, useState } from "react";
import { saveProfile } from "@/app/actions/profile";
import { panggil } from "@/lib/aksi";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cx, fokus } from "@/components/ui/cx";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { useUnsavedGuard } from "@/components/ui/useUnsavedGuard";
import type { MerchantOrder } from "@/lib/types";
import { cekTemplate, contohDariPesanan, MAKS_TEMPLATE, PLACEHOLDER, renderTemplate, TEMPLATE_BAWAAN } from "@/lib/wa-template";
import { ChatPreview } from "./ChatPreview";

/** M-11, WA-*: `template` null = memakai templat bawaan. `order` = pesanan contoh untuk pratinjau. */
export function TemplateEditor({ namaToko, template, order }: { namaToko: string; template: string | null; order: MerchantOrder | null }) {
  const [awal, setAwal] = useState(template ?? TEMPLATE_BAWAAN);
  const [teks, setTeks] = useState(awal);
  const [menyimpan, setMenyimpan] = useState(false);
  const [tanyaBawaan, setTanyaBawaan] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const kursor = useRef<number | null>(null);

  const dirty = teks !== awal;
  const guard = useUnsavedGuard(dirty);
  const galat = cekTemplate(teks);

  // Kursor dikembalikan setelah React menulis ulang isi textarea.
  useEffect(() => {
    if (kursor.current === null) return;
    const el = area.current;
    el?.focus();
    el?.setSelectionRange(kursor.current, kursor.current);
    kursor.current = null;
  }, [teks]);

  function sisip(kode: string) {
    const el = area.current;
    const a = el?.selectionStart ?? teks.length;
    const b = el?.selectionEnd ?? teks.length;
    kursor.current = a + kode.length;
    setTeks(teks.slice(0, a) + kode + teks.slice(b));
  }

  async function simpan() {
    if (galat || menyimpan) return;
    setMenyimpan(true);
    const r = await panggil(() => saveProfile({ wa_template: teks }));
    setMenyimpan(false);
    if ("error" in r) return toast({ tone: "danger", message: r.error.fields?.wa_template?.[0] ?? r.error.message });
    setAwal(teks);
    toast({ tone: "success", message: "Templat disimpan" });
  }

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-ink">Kata kunci</h2>
            <p className="text-sm text-ink-muted">Klik untuk menyisipkan di posisi kursor. Kata kunci diganti data pesanan saat pesan dikirim.</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {PLACEHOLDER.map((p) => (
                <li key={p.kode}>
                  <button type="button" onClick={() => sisip(p.kode)} className={cx("flex min-h-11 w-full flex-col items-start justify-center rounded-md border border-line-strong bg-surface px-3 py-1 text-left hover:bg-subtle", fokus)}>
                    <span className="font-mono text-sm font-semibold text-ink">{p.kode}</span>
                    <span className="text-sm text-ink-muted">{p.deskripsi}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <Field label="Isi templat" id="wa-template" help={`${teks.length.toLocaleString("id-ID")}/${MAKS_TEMPLATE.toLocaleString("id-ID")} karakter`} error={galat ?? undefined}>
            <Textarea ref={area} value={teks} onChange={(e) => setTeks(e.target.value)} rows={12} className="font-mono" />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setTanyaBawaan(true)}>Kembalikan ke bawaan</Button>
            {dirty && (
              <div className="flex flex-wrap items-center gap-3">
                {galat && <p id="wa-simpan-info" className="text-sm text-danger">Perbaiki isi templat dulu sebelum menyimpan.</p>}
                <Button loading={menyimpan} loadingText="Menyimpan…" aria-disabled={galat ? true : undefined} aria-describedby={galat ? "wa-simpan-info" : undefined} className={galat ? "opacity-50" : undefined} onClick={() => void simpan()}>Simpan templat</Button>
              </div>
            )}
          </div>
        </div>

        <ChatPreview
          namaToko={namaToko}
          teks={order ? renderTemplate(teks, contohDariPesanan(order)) : teks}
          catatan={order ? `Contoh dari pesanan ${order.code}.` : "Pratinjau terisi data pesanan setelah ada pesanan."}
        />
      </div>

      <ConfirmDialog open={tanyaBawaan} onClose={() => setTanyaBawaan(false)} title="Kembalikan ke bawaan?" body="Isi templat diganti dengan templat bawaan. Perubahan baru tersimpan setelah Simpan templat ditekan." confirmLabel="Kembalikan" tone="primary" onConfirm={() => { setTeks(TEMPLATE_BAWAAN); setTanyaBawaan(false); }} />
      <ConfirmDialog open={guard.open} onClose={guard.cancel} title="Buang perubahan?" body="Perubahan pada templat ini belum disimpan." confirmLabel="Buang perubahan" cancelLabel="Tetap di sini" tone="danger" onConfirm={guard.confirm} />
    </>
  );
}
