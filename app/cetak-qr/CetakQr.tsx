"use client";

import { Printer, ScanLine } from "lucide-react";
import { QrMeja } from "@/app/components/meja/QrMeja";
import { Button } from "@/app/components/ui/Button";
import type { Meja } from "@/types/meja";

// Kartu bergaris putus-putus untuk digunting; tombol cetak tidak ikut tercetak
export function CetakQr({ toko, meja }: { toko: string; meja: Meja[] }) {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6 print:max-w-none print:p-0">
      <style>{"@page { size: A4; margin: 12mm }"}</style>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">QR meja · {toko}</h1>
          <p className="text-ink-muted">{meja.length} meja aktif. Tempel tiap QR di mejanya.</p>
        </div>
        <Button onClick={() => window.print()}><Printer aria-hidden className="size-4" />Cetak</Button>
      </div>
      {meja.length === 0 ? (
        <p className="text-ink-muted">Belum ada meja aktif.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 print:gap-6">
          {meja.map((m) => (
            <li key={m.id} className="flex break-inside-avoid flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line-strong bg-paper p-6 text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-ink-muted">{toko}</p>
              <p className="font-display text-4xl font-bold text-ink">Meja {m.label}</p>
              <QrMeja meja={m} ukuran={200} />
              <p className="inline-flex items-center gap-2 font-semibold text-ink"><ScanLine aria-hidden className="size-5 text-primary" />Scan untuk lihat menu &amp; pesan</p>
              <p className="text-xs text-ink-muted">Bayar langsung dari HP · tanpa daftar akun</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
