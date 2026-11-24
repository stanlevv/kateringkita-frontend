// sitemap.xml untuk mesin pencari, disajikan Next.js di /sitemap.xml.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Daftar halaman publik. Hanya halaman ini yang layak muncul di hasil pencarian.
 * @returns alamat halaman beserta seberapa sering berubah dan prioritasnya
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/register`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
