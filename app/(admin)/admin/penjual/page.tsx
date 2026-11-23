import { Suspense } from "react";
import { MerchantTable } from "@/app/(admin)/admin/components/MerchantTable";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { LIMIT_MERCHANTS } from "@/services/admin-merchant.service";
import type { PageMeta, MerchantSummary } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

const VALID_STATUSES = ["pending", "needs_fix", "verified", "suspended"];

// A-05 — Daftar penjual. Filter di URL.
export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const apiQuery = new URLSearchParams();
  // Nilai URL tak dikenal diabaikan agar tidak menjadi halaman galat.
  const search = params.q?.trim();
  const status = params.status && VALID_STATUSES.includes(params.status) ? params.status : undefined;
  const open = params.open === "1" || params.open === "0" ? params.open : undefined;
  if (search) apiQuery.set("q", search);
  if (status) apiQuery.set("status", status);
  if (open) apiQuery.set("open", open);
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  apiQuery.set("page", String(page));
  apiQuery.set("limit", String(LIMIT_MERCHANTS));
  const response = await adminFetch<MerchantSummary[]>(`/merchants?${apiQuery}`);
  const meta = response.meta as PageMeta | undefined;
  return (
    <PageHeader title="Penjual" description="Semua penjual yang terdaftar.">
      {response.ok && response.data ? (
        <Suspense>
          <MerchantTable
            rows={response.data}
            page={page}
            total={meta?.total ?? response.data.length}
            filtered={!!(search || status || open)}
          />
        </Suspense>
      ) : (
        <LoadError
          title="Daftar penjual belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil daftar penjual. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
