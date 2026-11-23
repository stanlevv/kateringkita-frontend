import { Suspense } from "react";
import { MerchantTable } from "@/app/(admin)/admin/components/MerchantTable";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { LIMIT_MERCHANTS } from "@/services/admin-merchant.service";
import type { PageMeta, MerchantSummary } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

const STATUS = ["pending", "needs_fix", "verified", "suspended"];

// A-05 — Daftar penjual. Filter di URL.
export default async function PenjualPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = new URLSearchParams();
  // Nilai URL tak dikenal diabaikan agar tidak menjadi halaman galat.
  const cari = sp.q?.trim();
  const status = sp.status && STATUS.includes(sp.status) ? sp.status : undefined;
  const open = sp.open === "1" || sp.open === "0" ? sp.open : undefined;
  if (cari) q.set("q", cari);
  if (status) q.set("status", status);
  if (open) q.set("open", open);
  const n = Number(sp.page);
  const page = Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : 1;
  q.set("page", String(page));
  q.set("limit", String(LIMIT_MERCHANTS));
  const res = await adminFetch<MerchantSummary[]>(`/merchants?${q}`);
  const meta = res.meta as PageMeta | undefined;
  return (
    <PageHeader title="Penjual" description="Semua penjual yang terdaftar.">
      {res.ok && res.data ? (
        <Suspense>
          <MerchantTable
            rows={res.data}
            page={page}
            total={meta?.total ?? res.data.length}
            tersaring={!!(cari || status || open)}
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
