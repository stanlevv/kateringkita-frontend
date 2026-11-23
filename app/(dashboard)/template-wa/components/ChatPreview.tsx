// Komponen ChatPreview: pratinjau pesan WhatsApp berbentuk gelembung chat di /template-wa. Teks sudah diisi data
// pesanan contoh oleh TemplateEditor; kata kunci yang tidak dikenal (mis. {harga}) disorot merah.
import { MessageCircle } from "lucide-react";
import { findUnknownPlaceholders } from "@/lib/wa-template";

/**
 * Gelembung chat pratinjau.
 * @param props.storeName nama toko di kepala chat
 * @param props.text isi pesan yang sudah diisi data contoh
 * @param props.note catatan di bawah pratinjau (asal data contoh)
 * @returns section pratinjau
 */
export function ChatPreview({ storeName, text, note }: { storeName: string; text: string; note: string }) {
  return (
    <section aria-label="Pratinjau pesan" className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line bg-subtle p-3">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary"
        >
          <MessageCircle className="size-5" />
        </span>
        <p className="font-semibold text-ink">{storeName}</p>
      </div>
      <div className="min-h-48 bg-subtle p-4">
        <div className="ml-auto max-w-[90%] whitespace-pre-wrap break-words rounded-lg bg-success-bg p-3 text-ink shadow-sm">
          {text.split(/(\{[^{}\n]+\})/).map((part, i) =>
            findUnknownPlaceholders(part).length > 0 ? (
              <mark key={i} className="rounded bg-danger-bg px-1 text-danger">
                {part}
              </mark>
            ) : (
              part
            ),
          )}
        </div>
      </div>
      <p className="border-t border-line p-3 text-sm text-ink-muted">{note}</p>
    </section>
  );
}
