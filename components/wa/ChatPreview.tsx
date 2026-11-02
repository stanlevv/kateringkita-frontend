import { MessageCircle } from "lucide-react";
import { findUnknownPlaceholders } from "@/lib/wa-template";

/** WA-N2: gelembung chat. Kata kunci tak dikenal disorot (WA-E1). */
export function ChatPreview({ namaToko, teks, catatan }: { namaToko: string; teks: string; catatan: string }) {
  return (
    <section aria-label="Pratinjau pesan" className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line bg-subtle p-3">
        <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary"><MessageCircle className="size-5" /></span>
        <p className="font-semibold text-ink">{namaToko}</p>
      </div>
      <div className="min-h-48 bg-subtle p-4">
        <div className="ml-auto max-w-[90%] whitespace-pre-wrap break-words rounded-lg bg-success-bg p-3 text-ink shadow-sm">
          {teks.split(/(\{[^{}\n]+\})/).map((bagian, i) =>
            findUnknownPlaceholders(bagian).length > 0 ? <mark key={i} className="rounded bg-danger-bg px-1 text-danger">{bagian}</mark> : bagian,
          )}
        </div>
      </div>
      <p className="border-t border-line p-3 text-sm text-ink-muted">{catatan}</p>
    </section>
  );
}
