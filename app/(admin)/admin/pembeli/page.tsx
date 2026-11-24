// Halaman /admin/pembeli: daftar pembeli dengan pencarian dan filter status akun.
// Server component: membaca query URL lalu mengambil data dari backend GET /admin/customers.
import { CustomerTable, LIMIT_CUSTOMERS } from "@/app/(admin)/admin/components/CustomerTable";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { CustomerSummary, PageMeta } from "@/types/admin";

/**
 * Daftar pembeli. Tombol "Tambah pembeli" hanya untuk admin yang boleh mengubah data (bukan support).
 * @param props.searchParams query URL: `q`, `status`, `page`
 * @returns halaman daftar pembeli
 */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // 1. Wajib admin; baca filter dari URL (nilai yang tidak dikenal diabaikan).
  const { user } = await requireAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status === "active" || params.status === "inactive" ? params.status : "";
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  // 2. Ambil satu halaman dari backend.
  const apiQuery = new URLSearchParams({ page: String(page), limit: String(LIMIT_CUSTOMERS) });
  if (q) apiQuery.set("q", q);
  if (status) apiQuery.set("status", status);
  const response = await adminFetch<CustomerSummary[]>(`/customers?${apiQuery}`);
  const meta = response.meta as PageMeta | undefined;
  return (
    <PageHeader
      title="Pembeli"
      description="Semua akun pembeli yang terdaftar."
      actions={user.admin_level !== "support" && <LinkButton href="/admin/pembeli/baru">Tambah pembeli</LinkButton>}
    >
      {response.ok && response.data ? (
        <CustomerTable
          rows={response.data}
          page={page}
          total={meta?.total ?? response.data.length}
          q={q}
          status={status}
        />
      ) : (
        <LoadError
          title="Daftar pembeli belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil daftar pembeli. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
