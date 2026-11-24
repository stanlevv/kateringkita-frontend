// Halaman publik area /area/[slug]: toko yang mengantar ke satu titik ambil, dengan beberapa menu tiap toko.
import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { Star } from "lucide-react";
import { Brand } from "@/app/components/shell/Brand";
import { AREA_MIN_STORES, areaSlug, parseAreaId } from "@/lib/area";
import { formatRupiah } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";
import { getMerchantMenus, getPublicMerchants } from "@/services/catalog.service";
import { getPickupPoints } from "@/services/meta.service";

const WRAP = "mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8";
const MENUS_PER_STORE = 3;

type Props = { params: Promise<{ slug: string }> };

/** Titik ambil + toko + menu; `cache` agar generateMetadata dan halaman memanggil backend sekali per permintaan. */
const loadArea = cache(async (param: string) => {
  const id = parseAreaId(param);
  if (id === null) notFound();
  const pointsRes = await getPickupPoints();
  if ("error" in pointsRes) throw new Error(pointsRes.error.message);
  const point = pointsRes.data.find((p) => p.id === id);
  if (!point) notFound();
  const canonical = areaSlug(point);
  if (param !== canonical) permanentRedirect(`/area/${canonical}`);

  const storesRes = await getPublicMerchants(id);
  if ("error" in storesRes) throw new Error(storesRes.error.message);
  // shortcut: satu panggilan menu per toko; ganti dengan endpoint gabungan bila toko per titik > 20
  const stores = await Promise.all(
    storesRes.data.map(async (s) => {
      if (s.menu_count === 0) return { ...s, menus: [], isOpen: null };
      const res = await getMerchantMenus(s.slug, MENUS_PER_STORE);
      if ("error" in res) throw new Error(res.error.message);
      // PublicMerchantSummary tidak punya is_open; ambil dari menu (null bila tak ada menu).
      return { ...s, menus: res.data.slice(0, MENUS_PER_STORE), isOpen: res.data[0]?.merchant.is_open ?? null };
    }),
  );
  stores.sort(
    (a, b) =>
      Number(b.menus.length > 0) - Number(a.menus.length > 0) || a.business_name.localeCompare(b.business_name, "id"),
  );
  return { point, canonical, stores };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { point, canonical, stores } = await loadArea(slug);
  const title = `Katering ${point.name}`;
  const description =
    `${stores.length} toko katering mengantar ke ${point.name}. Lihat menu, harga, dan pesan lewat KateringKita.`.slice(
      0,
      160,
    );
  const thin = stores.filter((s) => s.menus.length > 0).length < AREA_MIN_STORES;
  return {
    title,
    description,
    alternates: { canonical: `/area/${canonical}` },
    ...(thin && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: SITE_NAME,
      title,
      description,
      url: `/area/${canonical}`,
      images: ["/opengraph-image"],
    },
  };
}

export default async function AreaPage({ params }: Props) {
  // Dirender per permintaan, bukan sekali saat build, supaya daftar toko selalu terbaru.
  await connection();
  const { slug } = await params;
  const { point, stores } = await loadArea(slug);

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className={`${WRAP} flex h-16 items-center justify-between`}>
          <Link href="/" aria-label="KateringKita, beranda" className="rounded-md">
            <Brand />
          </Link>
          <Link
            href="/toko"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-muted hover:text-ink"
          >
            Semua toko
          </Link>
        </div>
      </header>
      <main className={`${WRAP} py-10`}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          Katering di {point.name}
        </h1>
        {point.description && <p className="mt-2 text-ink-muted">{point.description}</p>}
        <p className="mt-2 text-ink-muted">
          Toko yang mengantar ke titik ini. Pilih toko untuk melihat menu lengkapnya.
        </p>
        {stores.length === 0 ? (
          <div className="mt-8">
            <p className="text-ink-muted">Belum ada toko yang mengantar ke titik ini.</p>
            <Link href="/toko" className="mt-2 inline-flex min-h-11 items-center font-semibold text-ink underline">
              Lihat daftar toko lain
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {stores.map((s) => (
              <li key={s.slug} className="rounded-lg border border-line bg-surface p-4">
                <Link href={`/toko/${s.slug}`} className="flex items-center gap-4 hover:text-primary">
                  <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-subtle text-lg font-bold text-ink-muted">
                    {s.logo_url ? (
                      <Image src={s.logo_url} alt="" fill unoptimized sizes="56px" className="object-cover" />
                    ) : (
                      s.business_name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{s.business_name}</span>
                    <span className="block text-sm text-ink-muted">
                      {s.merchant_type.name}
                      {s.isOpen === false && <span className="font-semibold"> · Sedang tutup</span>}
                    </span>
                    {s.rating_count > 0 && (
                      <span className="mt-1 inline-flex items-center gap-1 text-sm text-ink">
                        <Star aria-hidden className="size-4 text-primary" />
                        {s.rating_avg.toFixed(1)} <span className="text-ink-muted">({s.rating_count} ulasan)</span>
                      </span>
                    )}
                  </span>
                </Link>
                {s.menus.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                    {s.menus.map((m) => (
                      <li key={m.id} className="flex justify-between gap-3">
                        <span className="truncate">{m.name}</span>
                        <span className="shrink-0 text-ink-muted">{formatRupiah(m.price)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
