// Pembentuk JSON-LD FoodEstablishment untuk halaman toko publik (tanpa alamat/telepon: data privat).
import { formatRupiah } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import type { MenuCard, MerchantProfile } from "@/types/catalog";

export function merchantJsonLd(profile: MerchantProfile, menus: MenuCard[]): Record<string, unknown> {
  const sections = new Map<string, MenuCard[]>();
  for (const m of menus) sections.set(m.category.name, [...(sections.get(m.category.name) ?? []), m]);
  const image = profile.cover_url ?? profile.logo_url;
  const prices = menus.map((m) => m.price);
  const [min, max] = [Math.min(...prices), Math.max(...prices)];

  return {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: profile.business_name,
    url: `${SITE_URL}/toko/${profile.slug}`,
    servesCuisine: profile.merchant_type.name,
    openingHours: `Mo-Su ${profile.open_time}-${profile.close_time}`,
    ...(profile.pickup_points.length > 0 && {
      areaServed: profile.pickup_points.map((p) => ({ "@type": "Place", name: `${p.name}, Malang` })),
    }),
    ...(profile.description && { description: profile.description }),
    ...(image && { image }),
    ...(profile.rating_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: profile.rating_avg,
        reviewCount: profile.rating_count,
      },
    }),
    ...(menus.length > 0 && {
      priceRange: min === max ? formatRupiah(min) : `${formatRupiah(min)}–${formatRupiah(max)}`,
      hasMenu: {
        "@type": "Menu",
        hasMenuSection: [...sections].map(([name, items]) => ({
          "@type": "MenuSection",
          name,
          hasMenuItem: items.map((m) => ({
            "@type": "MenuItem",
            name: m.name,
            offers: { "@type": "Offer", price: m.price, priceCurrency: "IDR" },
          })),
        })),
      },
    }),
  };
}
