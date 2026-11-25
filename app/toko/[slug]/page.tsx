// Halaman publik toko /toko/[slug]: nama, jam buka, titik ambil, menu per kategori, JSON-LD (untuk mesin pencari).
import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, UtensilsCrossed } from "lucide-react";
import { JsonLd } from "@/app/components/JsonLd";
import { Brand } from "@/app/components/shell/Brand";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { areaSlug } from "@/lib/area";
import { formatRupiah } from "@/lib/format";
import { merchantJsonLd } from "@/lib/merchant-jsonld";
import { BUYER_APP_URL, SITE_NAME } from "@/lib/site";
import { getMerchantBySlug, getMerchantMenus } from "@/services/catalog.service";
import type { MenuCard } from "@/types/catalog";

const WRAP = "mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8";
/** Sesuai kolom merchants.slug VARCHAR(160); slug lain tidak mungkin ada, jadi tidak perlu ke backend. */
const SLUG_RE = /^[a-z0-9-]{1,160}$/;

type Props = { params: Promise<{ slug: string }> };

/** Profil toko; `cache` agar generateMetadata dan halaman memanggil backend sekali per permintaan. */
const loadProfile = cache(async (slug: string) => {
  if (!SLUG_RE.test(slug)) notFound();
  const res = await getMerchantBySlug(slug);
  if ("error" in res) {
    if (res.error.code === "NOT_FOUND") notFound();
    throw new Error(res.error.message);
  }
  return res.data;
});

/** Menu toko; `cache` agar generateMetadata dan halaman memanggil backend sekali per permintaan. */
const loadMenus = cache((slug: string) => getMerchantMenus(slug));

/**
 * Membuat metadata SEO halaman.
 * @param props objek berisi `params` (promise) dengan `slug` dari URL
 * @returns metadata judul, deskripsi, kanonik, dan OpenGraph; galat dari backend dilempar agar halaman galat tampil
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  const title = `${profile.business_name} — Menu & Harga`;
  const description = (
    profile.description ??
    `Pesan katering dari ${profile.business_name} (${profile.merchant_type.name}). Lihat menu, harga, dan titik ambil di KateringKita.`
  ).slice(0, 160);
  const image = profile.cover_url ?? profile.logo_url;
  // Toko tanpa menu dianggap halaman tipis; bila menu gagal dimuat, biarkan halaman yang melempar galat.
  const menusRes = await loadMenus(slug);
  const empty = !("error" in menusRes) && menusRes.data.length === 0;
  return {
    title,
    description,
    alternates: { canonical: `/toko/${profile.slug}` },
    ...(empty && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: SITE_NAME,
      title,
      description,
      url: `/toko/${profile.slug}`,
      ...(image && { images: [image] }),
    },
  };
}

/**
 * Halaman publik satu toko beserta menunya.
 * @param props objek berisi `params` (promise) dengan `slug` toko
 * @returns tampilan halaman toko, atau 404 bila toko tidak ditemukan
 */
export default async function TokoPage({ params }: Props) {
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) notFound();
  const [profile, menusRes] = await Promise.all([loadProfile(slug), loadMenus(slug)]);
  if ("error" in menusRes) throw new Error(menusRes.error.message);
  const menus = menusRes.data;

  const byCategory = new Map<string, MenuCard[]>();
  for (const m of menus) byCategory.set(m.category.name, [...(byCategory.get(m.category.name) ?? []), m]);

  return (
    <>
      <JsonLd data={merchantJsonLd(profile, menus)} />
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
          {profile.business_name}
        </h1>
        <p className="mt-2 text-ink-muted">
          {profile.merchant_type.name} · {profile.open_time}–{profile.close_time} WIB ·{" "}
          <span className={profile.is_open ? "font-semibold text-primary" : "font-semibold"}>
            {profile.is_open ? "Sedang buka" : "Sedang tutup"}
          </span>
          {profile.rating_count > 0 && (
            <span className="ml-2 inline-flex items-center gap-1">
              <Star aria-hidden className="size-4" />
              {profile.rating_avg.toFixed(1)} ({profile.rating_count} ulasan)
            </span>
          )}
        </p>
        {profile.description && <p className="mt-4 max-w-prose">{profile.description}</p>}
        {BUYER_APP_URL && (
          <LinkButton href={BUYER_APP_URL} size="lg" className="mt-6">
            Pesan lewat aplikasi
          </LinkButton>
        )}

        {profile.pickup_points.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold">Titik ambil</h2>
            <ul className="mt-3 space-y-2">
              {profile.pickup_points.map((pp) => (
                <li key={pp.id} className="rounded-md border border-line bg-surface p-3">
                  <Link
                    href={`/area/${areaSlug(pp)}`}
                    className="inline-flex min-h-11 items-center font-semibold text-primary underline"
                  >
                    {pp.name}
                  </Link>
                  {pp.description && <span className="block text-sm text-ink-muted">{pp.description}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {menus.length === 0 ? (
          <p className="mt-10 text-ink-muted">Toko ini belum memasang menu.</p>
        ) : (
          [...byCategory].map(([category, items]) => (
            <section key={category} className="mt-10">
              <h2 className="text-xl font-bold">{category}</h2>
              <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                {items.map((m) => (
                  <li key={m.id} className="flex overflow-hidden rounded-lg border border-line bg-surface">
                    <div className="relative flex size-28 shrink-0 items-center justify-center bg-subtle">
                      {m.image_url ? (
                        <Image src={m.image_url} alt={m.name} fill unoptimized sizes="112px" className="object-cover" />
                      ) : (
                        <UtensilsCrossed aria-hidden className="size-8 text-ink-muted" />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold">{m.name}</h3>
                      <p className="mt-1">
                        {formatRupiah(m.price)} <span className="text-sm text-ink-muted">/ {m.unit_label}</span>
                      </p>
                      {m.badge === "sold_out" && <p className="mt-1 text-sm font-semibold text-ink-muted">Habis</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
    </>
  );
}
