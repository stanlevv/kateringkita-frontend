"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Input, Select } from "@/app/components/ui/Input";

// Filter di URL (?level=&q=) agar bisa dibagikan, mis. tautan ke satu request ID
export function FilterLogServer() {
  const router = useRouter();
  const sp = useSearchParams();
  const [level, setLevel] = useState(sp.get("level") ?? "");
  const [q, setQ] = useState(sp.get("q") ?? "");

  function cari(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (level) p.set("level", level);
    if (q.trim()) p.set("q", q.trim());
    router.push(`/admin/server${p.size ? `?${p}` : ""}`);
  }

  return (
    <form onSubmit={cari} role="search" aria-label="Filter log server" className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Jenis
        <Select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">Semua</option>
          <option value="error">Error 5xx</option>
          <option value="slow">Lambat</option>
        </Select>
      </label>
      <label className="flex min-w-60 flex-1 flex-col gap-1.5 text-sm font-medium text-ink">
        Request ID atau path
        <Input value={q} maxLength={128} placeholder="mis. 5be7b0db-… atau /orders" onChange={(e) => setQ(e.target.value)} />
      </label>
      <Button type="submit"><Search aria-hidden className="size-4" />Cari</Button>
    </form>
  );
}
