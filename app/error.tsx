"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

// SY-2: tanpa detail teknis. Next 16: prop `retry` (bukan `reset`).
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-6 text-center text-ink">
      <TriangleAlert aria-hidden className="size-12 text-danger" />
      <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
      <p className="max-w-sm text-ink-muted">Halaman ini belum bisa ditampilkan. Coba lagi dalam beberapa saat.</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => retry()}>Coba lagi</Button>
        <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-4 font-medium hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
          Ke Dashboard
        </Link>
      </div>
    </main>
  );
}
