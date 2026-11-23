"use client";

import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Field } from "@/app/components/ui/Field";
import { Select } from "@/app/components/ui/Input";
import { Pagination } from "@/app/components/ui/Pagination";
import { Tabs } from "@/app/components/ui/Tabs";
import { LIMIT_AI_RESULTS, AI_RESULT_TABS, type AiResultTab } from "@/lib/ai-result";
import type { AiResult } from "@/types/ai-result";
import { AiResultCard } from "./AiResultCard";

const EMPTY_TITLES: Record<AiResultTab, string> = {
  menunggu: "Tidak ada hasil AI yang menunggu verifikasi",
  disetujui: "Belum ada hasil AI yang disetujui",
  ditolak: "Belum ada hasil AI yang ditolak",
  semua: "Belum ada hasil AI tersimpan",
};

/** Tab status + filter fitur di URL (tab Menunggu tanpa ?status); setiap kartu bisa disetujui / ditolak. */
export function AiResultList({
  rows,
  tab,
  feature,
  page,
  total,
  canEdit,
}: {
  rows: AiResult[];
  tab: AiResultTab;
  feature: string;
  page: number;
  total: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const buildHref = (changes: { status?: string; feature?: string; page?: number }) => {
    const query = new URLSearchParams();
    const nextStatus = changes.status ?? tab;
    const nextFeature = changes.feature ?? feature;
    if (nextStatus !== "menunggu") query.set("status", nextStatus);
    if (nextFeature) query.set("fitur", nextFeature);
    if (changes.page && changes.page > 1) query.set("page", String(changes.page));
    const queryString = query.toString();
    return `/admin/hasil-ai${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Tabs
          label="Status verifikasi"
          value={tab}
          onChange={(id) => router.push(buildHref({ status: id }))}
          tabs={AI_RESULT_TABS.map((tabItem) => ({ id: tabItem.id, label: tabItem.label }))}
        />
        <Field label="Fitur AI" id="filter-fitur-ai">
          <Select value={feature} onChange={(event) => router.push(buildHref({ feature: event.target.value }))}>
            <option value="">Semua fitur</option>
            <option value="asisten">Asisten toko</option>
            <option value="rekomendasi">Rekomendasi pembeli</option>
          </Select>
        </Field>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={EMPTY_TITLES[tab]}
          body="Hasil AI tersimpan setiap kali asisten toko atau rekomendasi pembeli menjawab dengan format yang valid."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((aiResult) => (
            <AiResultCard key={aiResult.id} aiResult={aiResult} canEdit={canEdit} />
          ))}
        </div>
      )}
      {total > LIMIT_AI_RESULTS && (
        <Pagination
          page={page}
          total={total}
          limit={LIMIT_AI_RESULTS}
          hrefFor={(pageNumber) => buildHref({ page: pageNumber })}
        />
      )}
    </div>
  );
}
