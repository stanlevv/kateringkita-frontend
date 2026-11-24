// Komponen Clock: hari dan jam WIB di header, diperbarui tiap 30 detik. Dipakai Header.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { useEffect, useState } from "react";
import { formatDayTime } from "@/lib/shell";

/**
 * Jam di header. `suppressHydrationWarning`: jam server dan jam peramban bisa berbeda beberapa detik saat halaman
 * pertama tampil; React diminta tidak memperingatkannya.
 * @returns elemen `time`
 */
export function Clock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(intervalId);
  }, []);
  return (
    <time suppressHydrationWarning className="whitespace-nowrap text-sm text-ink-muted">
      {formatDayTime(now)}
    </time>
  );
}
