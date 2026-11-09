import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, ChartColumn, Check, ChevronDown, Gauge, ListChecks, MapPin, MessageCircle, type LucideIcon } from "lucide-react";
import { getSession } from "@/services/authService";
import { AlurPesanan } from "@/app/components/landing/AlurPesanan";
import { PrinterDemo } from "@/app/components/landing/PrinterDemo";
import { Brand } from "@/app/components/shell/Brand";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "id_ID", siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/" },
};

const WRAP = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const EYEBROW = "text-sm font-semibold uppercase tracking-[0.12em] text-primary";
const H2 = "mt-3 font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-extrabold leading-[1.1] tracking-tight text-balance";

// Semua klaim di halaman ini harus sesuai fitur yang ada (LD-S1): tanpa angka pengguna atau testimoni karangan.
const SOROTAN = ["Kuota porsi harian", "Antrean pesanan langsung", "Laporan & ekspor CSV"];

const FAKTA = [
  { nilai: "5 menit", ket: "porsi ditahan untuk pembeli saat checkout" },
  { nilai: "5 detik", ket: "antrean pesanan diperbarui tanpa muat ulang" },
  { nilai: "QRIS · VA · Tunai", ket: "metode bayar tercatat di setiap pesanan" },
];

const FITUR: { icon: LucideIcon; judul: string; isi: string }[] = [
  { icon: Gauge, judul: "Kuota porsi harian", isi: "Atur jumlah porsi tiap menu untuk hari itu. Saat porsi habis, menu otomatis tidak bisa dipesan lagi." },
  { icon: ListChecks, judul: "Antrean pesanan langsung", isi: "Pesanan baru muncul sendiri di dashboard. Terima, masak, lalu tandai siap diambil, dengan jeda 5 detik untuk membatalkan salah ketuk." },
  { icon: MapPin, judul: "Titik ambil di kampus", isi: "Tentukan titik temu dan jam operasional, jadi mahasiswa tahu kapan dan di mana mengambil pesanannya." },
  { icon: MessageCircle, judul: "Template pesan WhatsApp", isi: "Kabari pembeli dengan pesan yang sudah berisi kode, menu, dan jam ambil. Tidak perlu mengetik ulang." },
  { icon: ChartColumn, judul: "Laporan penjualan", isi: "Pantau omzet, pesanan selesai, menu terlaris, dan jam tersibuk. Unduh CSV untuk pembukuan." },
  { icon: Calculator, judul: "Kalkulator HPP & promo", isi: "Hitung harga pokok per porsi sebelum menentukan harga jual, lalu buat kode promo toko saat perlu." },
];

const LANGKAH = [
  { judul: "Daftar sebagai penjual", isi: "Isi data diri dan usaha Anda. Admin memeriksa data sebelum toko ditampilkan ke pembeli." },
  { judul: "Pasang menu dan porsi", isi: "Tambahkan foto, harga, dan kuota porsi untuk hari yang Anda pilih." },
  { judul: "Terima pesanan pertama", isi: "Pesanan dari aplikasi mahasiswa masuk ke antrean. Proses, lalu kabari pembeli saat siap diambil." },
];

// Satu sumber untuk teks yang tampil dan JSON-LD FAQPage (Google mensyaratkan keduanya sama).
const FAQ = [
  { q: "Apa itu KateringKita?", a: "KateringKita adalah layanan pre-order katering untuk lingkungan kampus. Mahasiswa memesan lewat aplikasi KateringKita di ponsel, sedangkan penjual mengelola menu, kuota porsi, dan pesanan dari dashboard web ini." },
  { q: "Siapa yang bisa mendaftar sebagai penjual?", a: "Usaha katering atau dapur rumahan yang melayani mahasiswa di sekitar kampus. Setelah mendaftar, admin memeriksa data usaha Anda sebelum toko tampil di aplikasi." },
  { q: "Bagaimana kuota porsi mencegah pesanan berlebih?", a: "Setiap menu punya kuota porsi harian. Saat pembeli checkout, porsinya ditahan selama 5 menit sehingga pembeli lain melihat sisa porsi yang sebenarnya. Begitu kuota habis, menu tidak bisa dipesan lagi." },
  { q: "Metode pembayaran apa yang tercatat?", a: "Setiap pesanan mencatat metode bayarnya: QRIS, Virtual Account, atau tunai saat pesanan diambil. Metode ini terlihat di antrean dan rincian pesanan." },
  { q: "Apakah perlu memasang aplikasi khusus?", a: "Tidak. Dashboard penjual berjalan di browser, baik di laptop maupun ponsel. Aplikasi ponsel hanya dibutuhkan oleh pembeli." },
  { q: "Apakah data penjualan bisa diunduh?", a: "Bisa. Halaman laporan menampilkan omzet, pesanan selesai, menu terlaris, dan sebaran pesanan per jam, lalu dapat diunduh sebagai berkas CSV yang rapi dibuka di Excel." },
];

const ORG = `${SITE_URL}/#organisasi`;
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": ORG, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/apple-icon.png` },
    { "@type": "WebSite", "@id": `${SITE_URL}/#situs`, name: SITE_NAME, url: SITE_URL, inLanguage: "id-ID", publisher: { "@id": ORG } },
    {
      "@type": "SoftwareApplication", name: `${SITE_NAME} untuk Penjual`, url: SITE_URL, applicationCategory: "BusinessApplication",
      operatingSystem: "Web", inLanguage: "id-ID", description: SITE_DESCRIPTION, publisher: { "@id": ORG },
    },
    { "@type": "FAQPage", mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ],
};

// Halaman pembuka publik: hero + demo struk, fitur, alur satu pesanan, tiga langkah mulai, tanya jawab.
export default async function Home() {
  // LD-A1: backend mati atau sesi tidak valid -> tampilkan header pengunjung.
  const session = await getSession().catch(() => null);
  const masuk = session?.user.role === "merchant";
  const admin = session?.user.role === "admin";
  const cta = admin ? { href: "/admin", teks: "Ke panel admin" } : masuk ? { href: "/dashboard", teks: "Buka dashboard" } : { href: "/register", teks: "Daftar jadi penjual" };
  const tamu = !masuk && !admin;

  return (
    <div className="bg-surface text-ink">
      {/* JSON-LD berupa data, bukan skrip yang dijalankan; "<" di-escape sesuai panduan Next.js. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />

      <header className="sticky top-0 z-30 border-b border-line/80 bg-surface/90 backdrop-blur">
        <div className={`${WRAP} flex h-16 items-center justify-between gap-4`}>
          <Link href="/" aria-label="KateringKita, beranda" className="rounded-md"><Brand /></Link>
          <nav aria-label="Bagian halaman" className="hidden items-center gap-8 text-sm font-medium text-ink-muted md:flex">
            <a href="#fitur" className="hover:text-ink">Fitur</a>
            <a href="#alur" className="hover:text-ink">Cara kerja</a>
            <a href="#faq" className="hover:text-ink">Tanya jawab</a>
          </nav>
          <div className="flex items-center gap-2">
            {tamu && <Link href="/login" className="hidden min-h-11 items-center rounded-md px-3 text-sm font-semibold hover:bg-subtle sm:inline-flex">Masuk</Link>}
            <LinkButton href={cta.href} className="whitespace-nowrap text-sm sm:text-base">{cta.teks}</LinkButton>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(52rem_30rem_at_90%_-8%,var(--color-primary-soft),transparent_70%),radial-gradient(40rem_26rem_at_-12%_105%,var(--color-subtle),transparent_70%)]" />
          <div className={`${WRAP} grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-16 lg:py-20`}>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-ink-muted shadow-sm">
                <span aria-hidden className="size-2 rounded-full bg-accent" />
                Untuk penjual katering di sekitar kampus
              </p>
              <h1 className="mt-5 font-display text-[clamp(2.4rem,5.2vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance">
                {/* judul besar tanpa koma/titik: Plus Jakarta Sans tebal memberi celah lebar sebelum tanda baca */}
                Kelola pesanan katering kampus <span className="text-primary">tanpa porsi tersisa</span>
              </h1>
              <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-ink-muted">
                Mahasiswa memesan lewat aplikasi KateringKita, Anda menerima pre-order di satu dashboard. Tentukan porsi hari ini, dan pesanan tidak akan melebihi jumlah yang Anda masak.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <LinkButton href={cta.href} size="lg">{cta.teks}<ArrowRight aria-hidden className="size-5" /></LinkButton>
                {tamu ? <LinkButton href="/login" variant="secondary" size="lg">Masuk</LinkButton> : <LinkButton href="#alur" variant="secondary" size="lg">Ikuti satu pesanan</LinkButton>}
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-muted">
                {SOROTAN.map((t) => (
                  <li key={t} className="flex items-center gap-2"><Check aria-hidden className="size-4 text-success" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[28px] border border-line bg-surface p-4 shadow-[0_40px_80px_-40px_rgb(38_32_23/.35)] sm:p-7">
              <PrinterDemo />
            </div>
          </div>
        </section>

        <section aria-label="KateringKita secara singkat" className="border-y border-line bg-surface">
          <dl className={`${WRAP} grid gap-6 py-8 sm:grid-cols-3 sm:gap-0`}>
            {FAKTA.map(({ nilai, ket }) => (
              <div key={nilai} className="flex flex-col-reverse gap-1 sm:border-l sm:border-line sm:px-8 sm:first:border-l-0 sm:first:pl-0">
                <dt className="text-sm text-ink-muted">{ket}</dt>
                <dd className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{nilai}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="fitur" aria-labelledby="fitur-judul" className="scroll-mt-16 bg-canvas py-20 sm:py-24">
          <div className={WRAP}>
            <div className="max-w-2xl">
              <p className={EYEBROW}>Fitur</p>
              <h2 id="fitur-judul" className={H2}>Semua yang dibutuhkan dapur katering kampus</h2>
              <p className="mt-4 text-lg text-ink-muted">Dari menyiapkan menu sampai merekap penjualan, semuanya dari satu dashboard yang bisa dibuka di laptop maupun ponsel.</p>
            </div>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FITUR.map(({ icon: Icon, judul, isi }) => (
                <li key={judul} className="rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong motion-reduce:transition-none">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon aria-hidden className="size-5" /></span>
                  <h3 className="mt-5 font-display text-lg font-bold">{judul}</h3>
                  <p className="mt-2 text-ink-muted">{isi}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <AlurPesanan />

        <section id="mulai" aria-labelledby="mulai-judul" className="scroll-mt-16 bg-surface py-20 sm:py-24">
          <div className={`${WRAP} grid gap-12 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-16`}>
            <div>
              <p className={EYEBROW}>Mulai</p>
              <h2 id="mulai-judul" className={H2}>Mulai berjualan dalam tiga langkah</h2>
              <p className="mt-4 text-lg text-ink-muted">Pendaftaran cukup sekali. Setelah itu, Anda hanya perlu memperbarui porsi untuk setiap hari berjualan.</p>
              <LinkButton href={cta.href} size="lg" className="mt-8">{cta.teks}<ArrowRight aria-hidden className="size-5" /></LinkButton>
            </div>
            <ol className="grid gap-4">
              {LANGKAH.map(({ judul, isi }, i) => (
                <li key={judul} className="flex gap-5 rounded-2xl border border-line bg-canvas p-6">
                  <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-extrabold">{i + 1}</span>
                  <div>
                    <h3 className="font-display text-lg font-bold">{judul}</h3>
                    <p className="mt-1 text-ink-muted">{isi}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-judul" className="scroll-mt-16 bg-canvas py-20 sm:py-24">
          <div className={`${WRAP} grid gap-10 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-16`}>
            <div>
              <p className={EYEBROW}>Tanya jawab</p>
              <h2 id="faq-judul" className={H2}>Pertanyaan yang sering diajukan</h2>
              <p className="mt-4 text-lg text-ink-muted">Hal yang biasanya ditanyakan sebelum mendaftar sebagai penjual.</p>
            </div>
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group px-6">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display font-bold [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown aria-hidden className="size-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <p className="pb-5 text-ink-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="ajak-judul" className="bg-surface py-20 sm:py-24">
          <div className={WRAP}>
            <div className="rounded-[32px] bg-linear-to-br from-accent to-accent-light px-6 py-12 sm:px-12 sm:py-14 lg:flex lg:items-end lg:justify-between lg:gap-12 lg:px-16">
              <div className="max-w-2xl">
                <h2 id="ajak-judul" className="font-display text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-tight text-balance">Pasang menu malam ini dan terima pesanan besok pagi</h2>
                <p className="mt-4 text-lg">Daftar sebagai penjual, isi porsi untuk besok, dan pesanan mulai masuk ke antrean dapur Anda.</p>
              </div>
              {/* Garis fokus ink: biru bawaan hanya 2:1 di atas oranye. */}
              <Link href={cta.href} className="mt-8 inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md bg-ink px-6 text-lg font-semibold text-surface transition-colors hover:bg-steel focus-visible:outline-ink motion-reduce:transition-none lg:mt-0">
                {cta.teks}<ArrowRight aria-hidden className="size-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className={`${WRAP} grid grid-cols-2 gap-x-6 gap-y-8 py-12 sm:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))] sm:gap-10`}>
          <div className="col-span-2 sm:col-span-1">
            <Brand />
            <p className="mt-4 max-w-xs text-sm text-ink-muted">Layanan pre-order katering untuk dapur di sekitar kampus. Mahasiswa memesan lewat aplikasi, penjual mengelolanya di sini.</p>
          </div>
          <nav aria-label="Produk">
            <p className="text-sm font-semibold">Produk</p>
            <ul className="mt-2 text-sm text-ink-muted">
              <li><a href="#fitur" className="inline-flex min-h-11 items-center hover:text-ink">Fitur</a></li>
              <li><a href="#alur" className="inline-flex min-h-11 items-center hover:text-ink">Cara kerja</a></li>
              <li><a href="#faq" className="inline-flex min-h-11 items-center hover:text-ink">Tanya jawab</a></li>
            </ul>
          </nav>
          <nav aria-label="Akun">
            <p className="text-sm font-semibold">Akun</p>
            <ul className="mt-2 text-sm text-ink-muted">
              {tamu ? (
                <>
                  <li><Link href="/login" className="inline-flex min-h-11 items-center hover:text-ink">Masuk</Link></li>
                  <li><Link href="/register" className="inline-flex min-h-11 items-center hover:text-ink">Daftar penjual</Link></li>
                  <li><Link href="/lupa-sandi" className="inline-flex min-h-11 items-center hover:text-ink">Lupa kata sandi</Link></li>
                </>
              ) : (
                <li><Link href={cta.href} className="inline-flex min-h-11 items-center hover:text-ink">{cta.teks}</Link></li>
              )}
            </ul>
          </nav>
        </div>
        <div className="border-t border-line">
          <div className={`${WRAP} flex flex-col gap-1 py-6 text-sm text-ink-muted sm:flex-row sm:justify-between`}>
            <p>© {new Date().getFullYear()} KateringKita</p>
            <p>Contoh pesanan di halaman ini hanya ilustrasi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
