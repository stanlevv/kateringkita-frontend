// Halaman `/`: halaman pembuka publik untuk calon penjual (siapa pun boleh membuka, tanpa login).
// Isinya teks tetap. Satu-satunya data yang dibaca adalah sesi login (services/auth.service.ts),
// untuk memilih tombol utama.
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  ChartColumn,
  Check,
  ChevronDown,
  Gauge,
  ListChecks,
  MapPin,
  MessageCircle,
  QrCode,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getSession } from "@/services/auth.service";
import { OrderFlow } from "@/app/components/landing/OrderFlow";
import { PrinterDemo } from "@/app/components/landing/PrinterDemo";
import { Brand } from "@/app/components/shell/Brand";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

/** Metadata SEO halaman ini: alamat kanonik dan pratinjau tautan (Open Graph). */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

/** Kelas Tailwind yang dipakai berulang: lebar isi halaman, label kecil di atas judul, dan judul bagian (h2). */
const WRAP = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const EYEBROW = "text-sm font-semibold uppercase tracking-[0.12em] text-primary";
const SECTION_HEADING =
  "mt-3 font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-extrabold leading-[1.1] tracking-tight text-balance";

// Semua klaim di halaman ini harus sesuai fitur yang benar-benar ada: tanpa angka pengguna atau testimoni karangan.
/** Tiga keunggulan singkat yang dicentang di bawah tombol hero. */
const HIGHLIGHTS = ["Kuota porsi harian", "Antrean pesanan langsung", "Laporan & ekspor CSV"];

/** Angka singkat di pita bawah hero: `value` angka besar, `caption` keterangannya. */
const FACTS = [
  { value: "5 menit", caption: "porsi ditahan untuk pembeli saat checkout" },
  { value: "5 detik", caption: "antrean pesanan diperbarui tanpa muat ulang" },
  { value: "Tunai · VA · Online", caption: "bayar non-tunai lewat Midtrans, pesanan diterima otomatis begitu lunas" },
];

/** Kartu di bagian "Fitur": ikon, judul, dan penjelasan satu fitur. */
const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Gauge,
    title: "Kuota porsi harian",
    body: "Atur jumlah porsi tiap menu untuk hari itu. Saat porsi habis, menu otomatis tidak bisa dipesan lagi.",
  },
  {
    icon: ListChecks,
    title: "Antrean pesanan langsung",
    body: "Pesanan baru muncul sendiri di dashboard. Terima, masak, lalu tandai siap diambil, dengan jeda 5 detik untuk membatalkan salah ketuk.",
  },
  {
    icon: MapPin,
    title: "Titik ambil di kampus",
    body: "Tentukan titik temu dan jam operasional, jadi mahasiswa tahu kapan dan di mana mengambil pesanannya.",
  },
  {
    icon: MessageCircle,
    title: "Template pesan WhatsApp",
    body: "Kabari pembeli dengan pesan yang sudah berisi kode, menu, dan jam ambil. Tidak perlu mengetik ulang.",
  },
  {
    icon: ChartColumn,
    title: "Laporan penjualan",
    body: "Pantau omzet, pesanan selesai, menu terlaris, dan jam tersibuk. Unduh CSV untuk pembukuan.",
  },
  {
    icon: Calculator,
    title: "Kalkulator HPP & promo",
    body: "Hitung harga pokok per porsi sebelum menentukan harga jual, lalu buat kode promo toko saat perlu.",
  },
  {
    icon: QrCode,
    title: "Pesan dari meja",
    body: "Cetak QR untuk tiap meja. Pelanggan memilih menu dan bayar online tanpa membuat akun, lalu pesanannya masuk ke antrean yang sama.",
  },
  {
    icon: Wallet,
    title: "Bayar online, dana dicairkan",
    body: "Pembeli bayar lewat Virtual Account, QRIS, atau e-wallet melalui Midtrans. Bagian toko ditransfer ke rekening yang Anda daftarkan.",
  },
  {
    icon: Sparkles,
    title: "Asisten AI",
    body: "Tanyakan strategi harga dari Kalkulator HPP. Pembeli juga dibantu AI memilih menu yang sedang tersedia sesuai budget.",
  },
];

/** Tiga langkah mulai berjualan di bagian "Mulai". */
const STEPS = [
  {
    title: "Daftar sebagai penjual",
    body: "Isi data diri dan usaha Anda. Admin memeriksa data sebelum toko ditampilkan ke pembeli.",
  },
  { title: "Pasang menu dan porsi", body: "Tambahkan foto, harga, dan kuota porsi untuk hari yang Anda pilih." },
  {
    title: "Terima pesanan pertama",
    body: "Pesanan dari aplikasi mahasiswa atau QR di meja masuk ke antrean. Proses, lalu kabari pembeli saat siap.",
  },
];

// Satu sumber untuk teks yang tampil dan JSON-LD FAQPage (Google mensyaratkan keduanya sama).
const FAQ = [
  {
    question: "Apa itu KateringKita?",
    answer:
      "KateringKita adalah layanan pre-order katering untuk lingkungan kampus. Mahasiswa memesan lewat aplikasi KateringKita di ponsel atau memindai QR di meja toko, sedangkan penjual mengelola menu, kuota porsi, dan pesanan dari dashboard web ini.",
  },
  {
    question: "Siapa yang bisa mendaftar sebagai penjual?",
    answer:
      "Usaha katering atau dapur rumahan yang melayani mahasiswa di sekitar kampus. Setelah mendaftar, admin memeriksa data usaha Anda sebelum toko tampil di aplikasi.",
  },
  {
    question: "Bagaimana kuota porsi mencegah pesanan berlebih?",
    answer:
      "Setiap menu punya kuota porsi harian. Saat pembeli checkout, porsinya ditahan selama 5 menit sehingga pembeli lain melihat sisa porsi yang sebenarnya. Begitu kuota habis, menu tidak bisa dipesan lagi.",
  },
  {
    question: "Metode pembayaran apa saja yang bisa dipakai?",
    answer:
      "Tunai saat pesanan diambil, Virtual Account, atau bayar online (QRIS dan e-wallet) lewat Midtrans. Pembayaran non-tunai dikonfirmasi otomatis, jadi pesanan langsung masuk antrean begitu lunas.",
  },
  {
    question: "Bagaimana dana pembayaran non-tunai sampai ke penjual?",
    answer:
      "Pembayaran Virtual Account dan online masuk ke KateringKita lewat Midtrans. Setelah pesanan selesai, admin mentransfer bagian toko, yaitu subtotal dikurangi promo toko, ke rekening yang Anda isi di Pengaturan. Saldo dan riwayat pencairan terlihat di halaman yang sama.",
  },
  {
    question: "Apakah perlu memasang aplikasi khusus?",
    answer:
      "Tidak. Dashboard penjual berjalan di browser, baik di laptop maupun ponsel. Aplikasi ponsel hanya dibutuhkan pembeli pre-order; pesanan dari meja cukup lewat browser.",
  },
  {
    question: "Apakah data penjualan bisa diunduh?",
    answer:
      "Bisa. Halaman laporan menampilkan omzet, pesanan selesai, menu terlaris, dan sebaran pesanan per jam, lalu dapat diunduh sebagai berkas CSV yang rapi dibuka di Excel.",
  },
];

/** Data terstruktur (JSON-LD) untuk mesin pencari: organisasi, situs, aplikasi, dan daftar tanya jawab. */
const ORGANIZATION_ID = `${SITE_URL}/#organisasi`;
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      areaServed: [
        { "@type": "City", name: "Malang" },
        { "@type": "CollegeOrUniversity", name: "Universitas Brawijaya" },
      ],
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/apple-icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#situs`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "id-ID",
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": "SoftwareApplication",
      name: `${SITE_NAME} untuk Penjual`,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "id-ID",
      description: SITE_DESCRIPTION,
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
};

/**
 * Halaman pembuka publik: hero + demo struk, fitur, alur satu pesanan, tiga langkah mulai, dan tanya jawab.
 * Tombol utama menyesuaikan siapa yang membuka: admin ke panel admin, penjual ke dashboard, pengunjung ke pendaftaran.
 * @returns elemen halaman landing
 */
export default async function Home() {
  // 1. Baca sesi login. Bila backend mati atau sesi tidak sah, anggap pengunjung (header tetap tampil).
  const session = await getSession().catch(() => null);
  // 2. Pilih tombol utama (cta = call to action) sesuai peran.
  const isMerchant = session?.user.role === "merchant";
  const isAdmin = session?.user.role === "admin";
  const cta = isAdmin
    ? { href: "/admin", label: "Ke panel admin" }
    : isMerchant
      ? { href: "/dashboard", label: "Buka dashboard" }
      : { href: "/register", label: "Daftar jadi penjual" };
  const isVisitor = !isMerchant && !isAdmin;

  // 3. Tampilkan halaman; tautan "Masuk" hanya untuk pengunjung yang belum login.
  return (
    <div className="bg-surface text-ink">
      {/* JSON-LD berupa data, bukan skrip yang dijalankan; "<" di-escape sesuai panduan Next.js. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />

      <header className="sticky top-0 z-30 border-b border-line/80 bg-surface/90 backdrop-blur">
        <div className={`${WRAP} flex h-16 items-center justify-between gap-4`}>
          <Link href="/" aria-label="KateringKita, beranda" className="rounded-md">
            <Brand />
          </Link>
          <nav
            aria-label="Bagian halaman"
            className="hidden items-center gap-8 text-sm font-medium text-ink-muted md:flex"
          >
            <a href="#fitur" className="hover:text-ink">
              Fitur
            </a>
            <a href="#alur" className="hover:text-ink">
              Cara kerja
            </a>
            <a href="#faq" className="hover:text-ink">
              Tanya jawab
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {isVisitor && (
              <Link
                href="/login"
                className="hidden min-h-11 items-center rounded-md px-3 text-sm font-semibold hover:bg-subtle sm:inline-flex"
              >
                Masuk
              </Link>
            )}
            <LinkButton href={cta.href} className="whitespace-nowrap text-sm sm:text-base">
              {cta.label}
            </LinkButton>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(52rem_30rem_at_90%_-8%,var(--color-primary-soft),transparent_70%),radial-gradient(40rem_26rem_at_-12%_105%,var(--color-subtle),transparent_70%)]"
          />
          <div
            className={`${WRAP} grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-16 lg:py-20`}
          >
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-ink-muted shadow-sm">
                <span aria-hidden className="size-2 rounded-full bg-accent" />
                Untuk penjual katering di sekitar kampus UB Malang
              </p>
              <h1 className="mt-5 font-display text-[clamp(2.4rem,5.2vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance">
                {/* judul besar tanpa koma/titik: Plus Jakarta Sans tebal memberi celah lebar sebelum tanda baca */}
                Kelola pesanan katering kampus <span className="text-primary">tanpa porsi tersisa</span>
              </h1>
              <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-ink-muted">
                Mahasiswa memesan lewat aplikasi KateringKita, Anda menerima pre-order di satu dashboard. Tentukan porsi
                hari ini, dan pesanan tidak akan melebihi jumlah yang Anda masak.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <LinkButton href={cta.href} size="lg">
                  {cta.label}
                  <ArrowRight aria-hidden className="size-5" />
                </LinkButton>
                {isVisitor ? (
                  <LinkButton href="/login" variant="secondary" size="lg">
                    Masuk
                  </LinkButton>
                ) : (
                  <LinkButton href="#alur" variant="secondary" size="lg">
                    Ikuti satu pesanan
                  </LinkButton>
                )}
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-muted">
                {HIGHLIGHTS.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-2">
                    <Check aria-hidden className="size-4 text-success" />
                    {highlight}
                  </li>
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
            {FACTS.map(({ value, caption }) => (
              <div
                key={value}
                className="flex flex-col-reverse gap-1 sm:border-l sm:border-line sm:px-8 sm:first:border-l-0 sm:first:pl-0"
              >
                <dt className="text-sm text-ink-muted">{caption}</dt>
                <dd className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="fitur" aria-labelledby="fitur-judul" className="scroll-mt-16 bg-canvas py-20 sm:py-24">
          <div className={WRAP}>
            <div className="max-w-2xl">
              <p className={EYEBROW}>Fitur</p>
              <h2 id="fitur-judul" className={SECTION_HEADING}>
                Semua yang dibutuhkan dapur katering kampus
              </h2>
              <p className="mt-4 text-lg text-ink-muted">
                Dari menyiapkan menu sampai merekap penjualan, semuanya dari satu dashboard yang bisa dibuka di laptop
                maupun ponsel.
              </p>
            </div>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong motion-reduce:transition-none"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-ink-muted">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <OrderFlow />

        <section id="mulai" aria-labelledby="mulai-judul" className="scroll-mt-16 bg-surface py-20 sm:py-24">
          <div className={`${WRAP} grid gap-12 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-16`}>
            <div>
              <p className={EYEBROW}>Mulai</p>
              <h2 id="mulai-judul" className={SECTION_HEADING}>
                Mulai berjualan dalam tiga langkah
              </h2>
              <p className="mt-4 text-lg text-ink-muted">
                Pendaftaran cukup sekali. Setelah itu, Anda hanya perlu memperbarui porsi untuk setiap hari berjualan.
              </p>
              <LinkButton href={cta.href} size="lg" className="mt-8">
                {cta.label}
                <ArrowRight aria-hidden className="size-5" />
              </LinkButton>
            </div>
            <ol className="grid gap-4">
              {STEPS.map(({ title, body }, i) => (
                <li key={title} className="flex gap-5 rounded-2xl border border-line bg-canvas p-6">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-extrabold"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold">{title}</h3>
                    <p className="mt-1 text-ink-muted">{body}</p>
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
              <h2 id="faq-judul" className={SECTION_HEADING}>
                Pertanyaan yang sering diajukan
              </h2>
              <p className="mt-4 text-lg text-ink-muted">
                Hal yang biasanya ditanyakan sebelum mendaftar sebagai penjual.
              </p>
            </div>
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {FAQ.map(({ question, answer }) => (
                <details key={question} className="group px-6">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display font-bold [&::-webkit-details-marker]:hidden">
                    {question}
                    <ChevronDown
                      aria-hidden
                      className="size-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </summary>
                  <p className="pb-5 text-ink-muted">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="ajak-judul" className="bg-surface py-20 sm:py-24">
          <div className={WRAP}>
            <div className="rounded-[32px] bg-linear-to-br from-accent to-accent-light px-6 py-12 sm:px-12 sm:py-14 lg:flex lg:items-end lg:justify-between lg:gap-12 lg:px-16">
              <div className="max-w-2xl">
                <h2
                  id="ajak-judul"
                  className="font-display text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-tight text-balance"
                >
                  Pasang menu malam ini dan terima pesanan besok pagi
                </h2>
                <p className="mt-4 text-lg">
                  Daftar sebagai penjual, isi porsi untuk besok, dan pesanan mulai masuk ke antrean dapur Anda.
                </p>
              </div>
              {/* Garis fokus ink: biru bawaan hanya 2:1 di atas oranye. */}
              <Link
                href={cta.href}
                className="mt-8 inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md bg-ink px-6 text-lg font-semibold text-surface transition-colors hover:bg-steel focus-visible:outline-ink motion-reduce:transition-none lg:mt-0"
              >
                {cta.label}
                <ArrowRight aria-hidden className="size-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div
          className={`${WRAP} grid grid-cols-2 gap-x-6 gap-y-8 py-12 sm:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))] sm:gap-10`}
        >
          <div className="col-span-2 sm:col-span-1">
            <Brand />
            <p className="mt-4 max-w-xs text-sm text-ink-muted">
              Layanan pre-order katering untuk dapur di sekitar Universitas Brawijaya, Malang. Mahasiswa memesan lewat
              aplikasi, penjual mengelolanya di sini.
            </p>
          </div>
          <nav aria-label="Produk">
            <p className="text-sm font-semibold">Produk</p>
            <ul className="mt-2 text-sm text-ink-muted">
              <li>
                <a href="#fitur" className="inline-flex min-h-11 items-center hover:text-ink">
                  Fitur
                </a>
              </li>
              <li>
                <a href="#alur" className="inline-flex min-h-11 items-center hover:text-ink">
                  Cara kerja
                </a>
              </li>
              <li>
                <a href="#faq" className="inline-flex min-h-11 items-center hover:text-ink">
                  Tanya jawab
                </a>
              </li>
              <li>
                <Link href="/toko" className="inline-flex min-h-11 items-center hover:text-ink">
                  Lihat katering yang sudah bergabung
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Akun">
            <p className="text-sm font-semibold">Akun</p>
            <ul className="mt-2 text-sm text-ink-muted">
              {isVisitor ? (
                <>
                  <li>
                    <Link href="/login" className="inline-flex min-h-11 items-center hover:text-ink">
                      Masuk
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="inline-flex min-h-11 items-center hover:text-ink">
                      Daftar penjual
                    </Link>
                  </li>
                  <li>
                    <Link href="/lupa-sandi" className="inline-flex min-h-11 items-center hover:text-ink">
                      Lupa kata sandi
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link href={cta.href} className="inline-flex min-h-11 items-center hover:text-ink">
                    {cta.label}
                  </Link>
                </li>
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
