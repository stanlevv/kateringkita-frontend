"use client";

import { useEffect, useState } from "react";
import { formatHariJam } from "@/lib/shell";

export function Clock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(h);
  }, []);
  return <time suppressHydrationWarning className="whitespace-nowrap text-sm text-ink-muted">{formatHariJam(now)}</time>;
}
