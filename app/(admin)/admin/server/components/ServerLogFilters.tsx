// Komponen ServerLogFilters: penyaring log di /admin/server, berisi pilihan jenis (Semua, Error 5xx, Lambat) dan kotak
// cari request ID atau path. Tombol Cari mengganti URL (?level=&q=) sehingga page.tsx memuat ulang log yang cocok.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state dan router.
"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Input, Select } from "@/app/components/ui/Input";

/**
 * Penyaring log server. Penyaring ada di URL agar bisa dibagikan, mis. tautan ke satu request ID. Mencari selalu
 * kembali ke halaman 1.
 * @returns form pencarian
 */
export function ServerLogFilters() {
  // 1. Isian awal diambil dari URL sekarang.
  const router = useRouter();
  const searchParams = useSearchParams();
  const [level, setLevel] = useState(searchParams.get("level") ?? "");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // 2. Kirim: susun URL baru hanya dari isian yang terisi.
  function submit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (level) params.set("level", level);
    if (query.trim()) params.set("q", query.trim());
    router.push(`/admin/server${params.size ? `?${params}` : ""}`);
  }

  return (
    <form onSubmit={submit} role="search" aria-label="Filter log server" className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Jenis
        <Select value={level} onChange={(event) => setLevel(event.target.value)}>
          <option value="">Semua</option>
          <option value="error">Error 5xx</option>
          <option value="slow">Lambat</option>
        </Select>
      </label>
      <label className="flex min-w-60 flex-1 flex-col gap-1.5 text-sm font-medium text-ink">
        Request ID atau path
        <Input
          value={query}
          maxLength={128}
          placeholder="mis. 5be7b0db-… atau /orders"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <Button type="submit">
        <Search aria-hidden className="size-4" />
        Cari
      </Button>
    </form>
  );
}
