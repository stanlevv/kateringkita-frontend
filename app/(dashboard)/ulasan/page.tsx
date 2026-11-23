import { LoadError } from "@/app/components/LoadError";
import { MenuRatings, RatingSummary } from "@/app/(dashboard)/ulasan/components/RatingSummary";
import { ReviewList } from "@/app/(dashboard)/ulasan/components/ReviewList";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getMenus } from "@/services/menu.service";
import { getReviews } from "@/services/review.service";
import { requireMerchant } from "@/services/auth.service";
import { filterReviews } from "@/lib/review";

const parseNumberParam = (value: string | string[] | undefined, min: number, max: number) => {
  const parsed = typeof value === "string" && /^\d{1,9}$/.test(value) ? Number(value) : NaN;
  return parsed >= min && parsed <= max ? parsed : undefined;
};

// M-14 — Ulasan (UL-N1…N3, UL-S1). Filter menu, bintang, dan halaman tinggal di URL.
export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireMerchant();
  const [reviews, menus, params] = await Promise.all([getReviews(), getMenus(), searchParams]);
  if ("error" in reviews) {
    return (
      <PageHeader title="Ulasan">
        <LoadError
          title="Ulasan belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil ulasan. Periksa koneksi lalu coba lagi."
        />
      </PageHeader>
    );
  }
  const filter = { menu: parseNumberParam(params.menu, 1, 999_999_999), stars: parseNumberParam(params.bintang, 1, 5) };
  const { rows, total } = filterReviews(reviews.data, filter, 1);
  const currentPage = Math.min(parseNumberParam(params.page, 1, 99_999) ?? 1, Math.max(1, Math.ceil(total / 10)));
  const pageResult = currentPage === 1 ? { rows, total } : filterReviews(reviews.data, filter, currentPage);
  const menuOptions = "data" in menus ? menus.data.map((menu) => ({ id: menu.id, name: menu.name })) : [];

  return (
    <PageHeader title="Ulasan">
      <div className="flex flex-col gap-6">
        <RatingSummary reviews={reviews.data} />
        {reviews.data.length > 0 && (
          <div className="grid items-start gap-6 md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)]">
            <MenuRatings reviews={reviews.data} menus={menuOptions} menuId={filter.menu} />
            <ReviewList rows={pageResult.rows} total={pageResult.total} page={currentPage} filter={filter} />
          </div>
        )}
        {reviews.data.length === 0 && <ReviewList rows={[]} total={0} page={1} filter={{}} noReviews />}
      </div>
    </PageHeader>
  );
}
