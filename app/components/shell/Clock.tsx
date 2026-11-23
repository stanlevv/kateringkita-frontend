"use client";

import { useEffect, useState } from "react";
import { formatDayTime } from "@/lib/shell";

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
