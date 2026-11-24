// sitemap.xml untuk mesin pencari, disajikan Next.js di /sitemap.xml.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getPublicMerchants } from "@/services/catalog.service";

/**
 * Daftar halaman publik: beranda, register, daftar katering, dan satu halaman per toko.
 * Bila backend gagal, halaman toko dilewati agar sitemap tetap terbit.
 * @returns alamat halaman beserta seberapa sering berubah dan prioritasnya
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/register`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${SITE_URL}/toko`, changeFrequency: "daily", priority: 0.9 },
  ];
  try {
    const res = await getPublicMerchants();
    if ("data" in res) {
      for (const m of res.data) {
        entries.push({ url: `${SITE_URL}/toko/${m.slug}`, changeFrequency: "daily", priority: 0.7 });
      }
    }
  } catch {
    // backend tidak terjangkau: sitemap statis tetap dipakai
  }
  return entries;
}
