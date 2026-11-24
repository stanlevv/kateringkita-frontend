// sitemap.xml untuk mesin pencari, disajikan Next.js di /sitemap.xml.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { connection } from "next/server";
import { AREA_MIN_STORES, areaSlug } from "@/lib/area";
import { getPublicMerchants } from "@/services/catalog.service";
import { getPickupPoints } from "@/services/meta.service";

/**
 * Daftar halaman publik: beranda, register, daftar katering, dan satu halaman per toko bermenu,
 * dan satu halaman per titik ambil yang cukup berisi (sama dengan aturan indeks halaman area).
 * Bila backend gagal, hanya halaman statis yang terbit agar sitemap tetap terbit.
 * @returns alamat halaman beserta seberapa sering berubah dan prioritasnya
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Dirender per permintaan: tanpa ini sitemap membeku saat build dan daftar toko hilang.
  await connection();
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/register`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${SITE_URL}/toko`, changeFrequency: "daily", priority: 0.9 },
  ];
  try {
    const [res, pointsRes] = await Promise.all([getPublicMerchants(), getPickupPoints()]);
    if (!("data" in res) || !("data" in pointsRes)) return entries;
    // Toko tanpa menu bertanda noindex (F32), jadi tidak masuk sitemap.
    const stores = res.data.filter((m) => m.menu_count > 0);
    const perPoint = await Promise.all(pointsRes.data.map((p) => getPublicMerchants(p.id).catch(() => null)));
    const areas: MetadataRoute.Sitemap = [];
    for (const [i, point] of pointsRes.data.entries()) {
      const r = perPoint[i];
      // Satu area gagal dimuat: lewati area itu saja.
      if (!r || !("data" in r)) continue;
      if (r.data.filter((m) => m.menu_count > 0).length >= AREA_MIN_STORES) {
        areas.push({ url: `${SITE_URL}/area/${areaSlug(point)}`, changeFrequency: "weekly", priority: 0.8 });
      }
    }
    for (const m of stores) {
      entries.push({ url: `${SITE_URL}/toko/${m.slug}`, changeFrequency: "daily", priority: 0.7 });
    }
    entries.push(...areas);
  } catch {
    // backend tidak terjangkau: sitemap statis tetap dipakai
  }
  return entries;
}
