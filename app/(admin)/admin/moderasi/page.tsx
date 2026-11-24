// Halaman /admin/moderasi: moderasi ulasan dan menu, yaitu menyembunyikan ulasan atau menurunkan menu yang melanggar
// dari katalog. Server component: membaca searchParams (?jenis=ulasan|menu&status=&q=&page=), mengambil data lewat
// adminFetch (GET /admin/reviews atau /admin/menus), lalu menyerahkannya ke ModerationTable.
import Link from "next/link";
import { ModerationTable } from "@/app/(admin)/admin/components/ModerationTable";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { cx, focusRing } from "@/app/components/ui/cx";
import { Input } from "@/app/components/ui/Input";
import { Pagination } from "@/app/components/ui/Pagination";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ModerationMenu, PageMeta, ModerationReview } from "@/types/admin";

// Jumlah baris per halaman, jenis data (nilai ?jenis= dan path backend), dan pilihan filter status.
const LIMIT = 20;
const KINDS = { ulasan: { label: "Ulasan", path: "/reviews" }, menu: { label: "Menu", path: "/menus" } } as const;
const STATUS_FILTERS = { "": "Semua", active: "Normal", moderated: "Dimoderasi" } as const;
type ModerationKind = keyof typeof KINDS;

// Gaya tautan pil; pil yang aktif berwarna utama.
const pillClass = (active: boolean) =>
  cx(
    "inline-flex min-h-11 items-center rounded-md border px-4 font-medium",
    focusRing,
    active ? "border-primary bg-primary text-surface" : "border-line-strong bg-surface text-ink hover:bg-subtle",
  );

/**
 * Halaman moderasi. Filter ada di URL. Menangguhkan toko tidak ada di sini, tetapi di halaman Penjual.
 * @param props.searchParams parameter URL: `jenis` ("ulasan"/"menu"), `status` ("active"/"moderated"), `q`, `page`
 * @returns PageHeader berisi pil jenis, pil status, kotak cari, ModerationTable, dan paginasi (atau LoadError)
 */
export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // 1. Baca parameter URL; nilai yang tidak dikenal jatuh ke bawaan (ulasan, semua status, halaman 1).
  await requireAdmin();
  const params = await searchParams;
  const kind: ModerationKind = params.jenis === "menu" ? "menu" : "ulasan";
  const status = params.status === "active" || params.status === "moderated" ? params.status : "";
  const search = params.q?.trim() ?? "";
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  // 2. Pembuat URL halaman ini. Pindah jenis membuang kata cari; status dan halaman 1 tidak ditulis bila kosong.
  const moderationUrl = (options: { kind?: ModerationKind; status?: string; page?: number }) => {
    const urlParams = new URLSearchParams({ jenis: options.kind ?? kind });
    const statusValue = options.status ?? status;
    if (statusValue) urlParams.set("status", statusValue);
    if (search && !options.kind) urlParams.set("q", search);
    if (options.page && options.page > 1) urlParams.set("page", String(options.page));
    return `/admin/moderasi?${urlParams}`;
  };

  // 3. Ambil satu halaman data dari backend sesuai jenis dan filter.
  const apiQuery = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (status) apiQuery.set("status", status);
  if (search) apiQuery.set("q", search);
  const response = await adminFetch<ModerationReview[] | ModerationMenu[]>(`${KINDS[kind].path}?${apiQuery}`);
  const meta = response.meta as PageMeta | undefined;

  return (
    <PageHeader
      title="Moderasi"
      description="Sembunyikan ulasan atau turunkan menu yang melanggar. Untuk menangguhkan toko, buka halaman Penjual."
    >
      <div className="flex flex-col gap-4">
        <nav aria-label="Jenis moderasi" className="flex flex-wrap gap-2">
          {(Object.keys(KINDS) as ModerationKind[]).map((kindKey) => (
            <Link
              key={kindKey}
              href={moderationUrl({ kind: kindKey, status: "" })}
              aria-current={kindKey === kind ? "page" : undefined}
              className={pillClass(kindKey === kind)}
            >
              {KINDS[kindKey].label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-end gap-3">
          <nav aria-label="Filter status" className="flex flex-wrap gap-2">
            {Object.entries(STATUS_FILTERS).map(([statusKey, label]) => (
              <Link
                key={statusKey}
                href={moderationUrl({ status: statusKey })}
                aria-current={statusKey === status ? "true" : undefined}
                className={pillClass(statusKey === status)}
              >
                {label}
              </Link>
            ))}
          </nav>
          <form action="/admin/moderasi" className="flex gap-2">
            <input type="hidden" name="jenis" value={kind} />
            {status && <input type="hidden" name="status" value={status} />}
            <Input
              type="search"
              name="q"
              defaultValue={search}
              aria-label={kind === "ulasan" ? "Cari komentar, menu, atau toko" : "Cari menu atau toko"}
              placeholder="Cari…"
            />
          </form>
        </div>
        {response.ok && response.data ? (
          <>
            {kind === "ulasan" ? (
              <ModerationTable kind="ulasan" rows={response.data as ModerationReview[]} />
            ) : (
              <ModerationTable kind="menu" rows={response.data as ModerationMenu[]} />
            )}
            <Pagination
              page={page}
              total={meta?.total ?? response.data.length}
              limit={LIMIT}
              hrefFor={(pageNumber) => moderationUrl({ page: pageNumber })}
            />
          </>
        ) : (
          <LoadError
            title="Data moderasi belum bisa dimuat"
            body="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi."
          />
        )}
      </div>
    </PageHeader>
  );
}
