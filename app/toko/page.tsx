// Halaman publik /toko: daftar katering yang sudah bergabung, jadi pintu masuk ke tiap halaman toko.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Brand } from "@/app/components/shell/Brand";
import { connection } from "next/server";
import { areaSlug } from "@/lib/area";
import { SITE_NAME } from "@/lib/site";
import { getPublicMerchants } from "@/services/catalog.service";
import { getPickupPoints } from "@/services/meta.service";

const WRAP = "mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8";

const DESCRIPTION =
  "Daftar katering di sekitar Universitas Brawijaya, Malang: nasi box, makan siang, dan pesanan acara. Lihat menu, harga, dan titik ambilnya.";

export const metadata: Metadata = {
  title: "Katering Kampus UB Malang",
  description: DESCRIPTION,
  alternates: { canonical: "/toko" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    title: "Katering Kampus UB Malang",
    description: DESCRIPTION,
    url: "/toko",
    images: ["/opengraph-image"],
  },
};

export default async function DaftarTokoPage() {
  // Dirender per permintaan, bukan sekali saat build, supaya daftar toko selalu terbaru.
  await connection();
  // Titik ambil bagian pelengkap: bila gagal dimuat, sembunyikan saja.
  const [res, points] = await Promise.all([
    getPublicMerchants(),
    getPickupPoints()
      .then((r) => ("data" in r ? r.data : []))
      .catch(() => []),
  ]);
  if ("error" in res) throw new Error(res.error.message);
  const merchants = res.data;

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className={`${WRAP} flex h-16 items-center`}>
          <Link href="/" aria-label="KateringKita, beranda" className="rounded-md">
            <Brand />
          </Link>
        </div>
      </header>
      <main className={`${WRAP} py-10`}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          Katering di sekitar kampus UB Malang
        </h1>
        <p className="mt-2 text-ink-muted">
          Pesan nasi box, makan siang, atau katering acara dari dapur di sekitar Universitas Brawijaya, Malang. Pilih
          toko untuk melihat menu dan harganya, lalu ambil pesanan di titik temu kampus.
        </p>
        {merchants.length === 0 ? (
          <p className="mt-8 text-ink-muted">Belum ada toko yang bisa dipesan.</p>
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {merchants.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/toko/${m.slug}`}
                  className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4 hover:border-primary"
                >
                  <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-subtle text-lg font-bold text-ink-muted">
                    {m.logo_url ? (
                      <Image src={m.logo_url} alt="" fill unoptimized sizes="56px" className="object-cover" />
                    ) : (
                      m.business_name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{m.business_name}</span>
                    <span className="block text-sm text-ink-muted">{m.merchant_type.name}</span>
                    {m.rating_count > 0 && (
                      <span className="mt-1 inline-flex items-center gap-1 text-sm">
                        <Star aria-hidden className="size-4 text-primary" />
                        {m.rating_avg.toFixed(1)} <span className="text-ink-muted">({m.rating_count} ulasan)</span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {points.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold">Cari berdasarkan titik ambil</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {points.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/area/${areaSlug(p)}`}
                    className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 hover:border-primary"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
