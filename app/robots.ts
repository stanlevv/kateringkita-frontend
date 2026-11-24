// robots.txt untuk mesin pencari: halaman di balik login tidak diindeks, dan lokasi sitemap diberitahukan.
import type { MetadataRoute } from "next";
import { PRIVATE_PATHS, SITE_URL } from "@/lib/site";

/**
 * Isi robots.txt yang disajikan Next.js di /robots.txt.
 * @returns aturan izinkan/larang dan alamat sitemap
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
