import { GagalMuat } from "@/components/dashboard/GagalMuat";
import { MenuRatings, RatingSummary } from "@/components/reviews/RatingSummary";
import { ReviewList } from "@/components/reviews/ReviewList";
import { PageHeader } from "@/components/shell/PageHeader";
import { getMenus } from "@/lib/data/menus";
import { getReviews } from "@/lib/data/reviews";
import { requireMerchant } from "@/lib/session";
import { saringUlasan } from "@/lib/ulasan";

const angka = (v: string | string[] | undefined, min: number, maks: number) => {
  const n = typeof v === "string" && /^\d{1,9}$/.test(v) ? Number(v) : NaN;
  return n >= min && n <= maks ? n : undefined;
};

// M-14 — Ulasan (UL-N1…N3, UL-S1). Filter menu, bintang, dan halaman tinggal di URL.
export default async function UlasanPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireMerchant();
  const [ulasan, menus, q] = await Promise.all([getReviews(), getMenus(), searchParams]);
  if ("error" in ulasan) {
    return <PageHeader title="Ulasan"><GagalMuat judul="Ulasan belum bisa dimuat" isi="Terjadi kesalahan saat mengambil ulasan. Periksa koneksi lalu coba lagi." /></PageHeader>;
  }
  const filter = { menu: angka(q.menu, 1, 999_999_999), bintang: angka(q.bintang, 1, 5) };
  const { rows, total } = saringUlasan(ulasan.data, filter, 1);
  const halaman = Math.min(angka(q.page, 1, 99_999) ?? 1, Math.max(1, Math.ceil(total / 10)));
  const kini = halaman === 1 ? { rows, total } : saringUlasan(ulasan.data, filter, halaman);
  const daftarMenu = "data" in menus ? menus.data.map((m) => ({ id: m.id, name: m.name })) : [];

  return (
    <PageHeader title="Ulasan">
      <div className="flex flex-col gap-6">
        <RatingSummary reviews={ulasan.data} />
        {ulasan.data.length > 0 && (
          <div className="grid items-start gap-6 md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)]">
            <MenuRatings reviews={ulasan.data} menus={daftarMenu} menuId={filter.menu} />
            <ReviewList rows={kini.rows} total={kini.total} page={halaman} filter={filter} />
          </div>
        )}
        {ulasan.data.length === 0 && <ReviewList rows={[]} total={0} page={1} filter={{}} kosongSemua />}
      </div>
    </PageHeader>
  );
}
