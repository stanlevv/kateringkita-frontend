// Test merchantJsonLd: JSON-LD FoodEstablishment untuk halaman toko publik.
import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/site";
import type { MenuCard, MerchantProfile } from "@/types/catalog";
import { merchantJsonLd } from "./merchant-jsonld";

const profile: MerchantProfile = {
  id: 1, slug: "warung-bu-sari", business_name: "Warung Bu Sari", description: "Katering rumahan",
  logo_url: "https://img/logo.png", cover_url: null, merchant_type: { id: 2, name: "Katering" },
  is_open: true, open_time: "08:00", close_time: "17:00", rating_avg: 0, rating_count: 0, pickup_points: [],
};
const menu = (id: number, name: string, cat: string): MenuCard => ({
  id, name, price: 15000, image_url: null, unit_label: "porsi", category: { id: 1, name: cat, slug: cat },
  merchant: { id: 1, slug: "warung-bu-sari", business_name: "Warung Bu Sari", is_open: true },
  available: 5, badge: "available", rating_avg: 0, rating_count: 0, is_favorite: false,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ld = Record<string, any>;

describe("merchantJsonLd", () => {
  it("memetakan field dasar dan menu", () => {
    const ld = merchantJsonLd(profile, [menu(1, "Nasi Ayam", "Makanan"), menu(2, "Es Teh", "Minuman"), menu(3, "Nasi Telur", "Makanan")]) as Ld;
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FoodEstablishment");
    expect(ld.name).toBe("Warung Bu Sari");
    expect(ld.url).toBe(`${SITE_URL}/toko/warung-bu-sari`);
    expect(ld.servesCuisine).toBe("Katering");
    expect(ld.image).toBe("https://img/logo.png");
    expect(ld.openingHours).toBe("Mo-Su 08:00-17:00");
    expect(ld.hasMenu.hasMenuSection).toHaveLength(2);
    expect(ld.hasMenu.hasMenuSection[0].hasMenuItem).toHaveLength(2);
    expect(ld.hasMenu.hasMenuSection[0].hasMenuItem[0]).toEqual({
      "@type": "MenuItem", name: "Nasi Ayam",
      offers: { "@type": "Offer", price: 15000, priceCurrency: "IDR" },
    });
  });
  it("aggregateRating hanya bila ada ulasan", () => {
    expect(merchantJsonLd(profile, [])).not.toHaveProperty("aggregateRating");
    const ld = merchantJsonLd({ ...profile, rating_avg: 4.5, rating_count: 4 }, []) as Ld;
    expect(ld.aggregateRating).toEqual({ "@type": "AggregateRating", ratingValue: 4.5, reviewCount: 4 });
  });
  it("tanpa menu tidak ada hasMenu; tanpa data privat", () => {
    const ld = merchantJsonLd(profile, []);
    expect(ld).not.toHaveProperty("hasMenu");
    expect(ld).not.toHaveProperty("address");
    expect(ld).not.toHaveProperty("telephone");
  });
});
