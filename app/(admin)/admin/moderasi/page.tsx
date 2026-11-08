import Link from "next/link";
import { ModerasiTable } from "@/app/(admin)/admin/components/ModerasiTable";
import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { cx, fokus } from "@/app/components/ui/cx";
import { Input } from "@/app/components/ui/Input";
import { Pagination } from "@/app/components/ui/Pagination";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { MenuModerasi, MetaHalaman, UlasanModerasi } from "@/types/admin";

const LIMIT = 20;
const JENIS = { ulasan: { label: "Ulasan", path: "/reviews" }, menu: { label: "Menu", path: "/menus" } } as const;
const STATUS = { "": "Semua", active: "Normal", moderated: "Dimoderasi" } as const;
type Jenis = keyof typeof JENIS;

const pil = (aktif: boolean) =>
  cx("inline-flex min-h-11 items-center rounded-md border px-4 font-medium", fokus, aktif ? "border-primary bg-primary text-surface" : "border-line-strong bg-surface text-ink hover:bg-subtle");

// F19 — moderasi ulasan & menu. Filter di URL; suspend toko ada di halaman Penjual.
export default async function ModerasiPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const jenis: Jenis = sp.jenis === "menu" ? "menu" : "ulasan";
  const status = sp.status === "active" || sp.status === "moderated" ? sp.status : "";
  const cari = sp.q?.trim() ?? "";
  const n = Number(sp.page);
  const page = Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : 1;
  const url = (o: { jenis?: Jenis; status?: string; page?: number }) => {
    const q = new URLSearchParams({ jenis: o.jenis ?? jenis });
    const st = o.status ?? status;
    if (st) q.set("status", st);
    if (cari && !o.jenis) q.set("q", cari);
    if (o.page && o.page > 1) q.set("page", String(o.page));
    return `/admin/moderasi?${q}`;
  };

  const q = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (status) q.set("status", status);
  if (cari) q.set("q", cari);
  const res = await adminFetch<UlasanModerasi[] | MenuModerasi[]>(`${JENIS[jenis].path}?${q}`);
  const meta = res.meta as MetaHalaman | undefined;

  return (
    <PageHeader title="Moderasi" description="Sembunyikan ulasan atau turunkan menu yang melanggar. Untuk menangguhkan toko, buka halaman Penjual.">
      <div className="flex flex-col gap-4">
        <nav aria-label="Jenis moderasi" className="flex flex-wrap gap-2">
          {(Object.keys(JENIS) as Jenis[]).map((j) => (
            <Link key={j} href={url({ jenis: j, status: "" })} aria-current={j === jenis ? "page" : undefined} className={pil(j === jenis)}>{JENIS[j].label}</Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-end gap-3">
          <nav aria-label="Filter status" className="flex flex-wrap gap-2">
            {Object.entries(STATUS).map(([k, label]) => (
              <Link key={k} href={url({ status: k })} aria-current={k === status ? "true" : undefined} className={pil(k === status)}>{label}</Link>
            ))}
          </nav>
          <form action="/admin/moderasi" className="flex gap-2">
            <input type="hidden" name="jenis" value={jenis} />
            {status && <input type="hidden" name="status" value={status} />}
            <Input type="search" name="q" defaultValue={cari} aria-label={jenis === "ulasan" ? "Cari komentar, menu, atau toko" : "Cari menu atau toko"} placeholder="Cari…" />
          </form>
        </div>
        {res.ok && res.data ? (
          <>
            {jenis === "ulasan"
              ? <ModerasiTable jenis="ulasan" rows={res.data as UlasanModerasi[]} />
              : <ModerasiTable jenis="menu" rows={res.data as MenuModerasi[]} />}
            <Pagination page={page} total={meta?.total ?? res.data.length} limit={LIMIT} hrefFor={(p) => url({ page: p })} />
          </>
        ) : (
          <GagalMuat judul="Data moderasi belum bisa dimuat" isi="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi." />
        )}
      </div>
    </PageHeader>
  );
}
