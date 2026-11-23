"use client";

import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Field } from "@/app/components/ui/Field";
import { Select } from "@/app/components/ui/Input";
import { Pagination } from "@/app/components/ui/Pagination";
import { Tabs } from "@/app/components/ui/Tabs";
import { LIMIT_HASIL_AI, TAB_HASIL_AI as TAB, type TabHasilAi } from "@/lib/hasil-ai";
import type { HasilAi } from "@/types/hasil-ai";
import { KartuHasilAi } from "./KartuHasilAi";

const KOSONG: Record<TabHasilAi, string> = {
  menunggu: "Tidak ada hasil AI yang menunggu verifikasi",
  disetujui: "Belum ada hasil AI yang disetujui",
  ditolak: "Belum ada hasil AI yang ditolak",
  semua: "Belum ada hasil AI tersimpan",
};

/** Tab status + filter fitur di URL (tab Menunggu tanpa ?status); setiap kartu bisa disetujui / ditolak. */
export function DaftarHasilAi({
  rows,
  tab,
  fitur,
  page,
  total,
  bolehUbah,
}: {
  rows: HasilAi[];
  tab: TabHasilAi;
  fitur: string;
  page: number;
  total: number;
  bolehUbah: boolean;
}) {
  const router = useRouter();
  const url = (o: { status?: string; fitur?: string; page?: number }) => {
    const q = new URLSearchParams();
    const st = o.status ?? tab;
    const f = o.fitur ?? fitur;
    if (st !== "menunggu") q.set("status", st);
    if (f) q.set("fitur", f);
    if (o.page && o.page > 1) q.set("page", String(o.page));
    const s = q.toString();
    return `/admin/hasil-ai${s ? `?${s}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Tabs
          label="Status verifikasi"
          value={tab}
          onChange={(id) => router.push(url({ status: id }))}
          tabs={TAB.map((t) => ({ id: t.id, label: t.label }))}
        />
        <Field label="Fitur AI" id="filter-fitur-ai">
          <Select value={fitur} onChange={(e) => router.push(url({ fitur: e.target.value }))}>
            <option value="">Semua fitur</option>
            <option value="asisten">Asisten toko</option>
            <option value="rekomendasi">Rekomendasi pembeli</option>
          </Select>
        </Field>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={KOSONG[tab]}
          body="Hasil AI tersimpan setiap kali asisten toko atau rekomendasi pembeli menjawab dengan format yang valid."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((h) => (
            <KartuHasilAi key={h.id} h={h} bolehUbah={bolehUbah} />
          ))}
        </div>
      )}
      {total > LIMIT_HASIL_AI && (
        <Pagination page={page} total={total} limit={LIMIT_HASIL_AI} hrefFor={(p) => url({ page: p })} />
      )}
    </div>
  );
}
