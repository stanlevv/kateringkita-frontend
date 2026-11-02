import Link from "next/link";
import { getSession } from "@/lib/session";
import { AlurPesanan } from "@/components/landing/AlurPesanan";
import { PrinterDemo } from "@/components/landing/PrinterDemo";
import s from "@/components/landing/landing.module.css";

// Halaman pembuka "rel tiket dapur": struk tercetak, papan sisa porsi, dan alur satu pesanan.
export default async function Home() {
  // LD-A1: backend mati atau sesi tidak valid -> tampilkan header pengunjung.
  const session = await getSession().catch(() => null);
  const masuk = session?.user.role === "merchant";
  const admin = session?.user.role === "admin";
  const cta = admin ? { href: "/admin", teks: "Ke panel admin" } : masuk ? { href: "/dashboard", teks: "Buka dashboard" } : { href: "/register", teks: "Daftar jadi penjual" };
  const tamu = !masuk && !admin;

  return (
    <div className={s.page}>
      <header>
        <div className={`${s.wrap} ${s.nav}`}>
          <Link className={s.logo} href="/" aria-label="KateringKita, beranda">
            <i><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M3 11h18M5 11a7 7 0 0 1 14 0M4 15h16l-1.5 4h-13z" /></svg></i>
            KateringKita
          </Link>
          <nav aria-label="Akun" className={s.navR}>
            <a className={s.hide} href="#alur">Alur pesanan</a>
            {tamu && <Link className={s.hide} href="/login">Masuk</Link>}
            <Link className={s.btn} href={cta.href}>{cta.teks}</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className={s.hero}>
          <div className={s.wrap}>
            <div>
              <p className={s.for}>Untuk dapur katering di sekitar kampus</p>
              <h1>Masak secukupnya. <span className={s.o}>Habis tanpa sisa.</span></h1>
              <p className={s.lead}>Anda tentukan porsi hari ini. Mahasiswa memesan dari aplikasi, dan porsinya tidak akan terjual lebih dari yang Anda masak.</p>
              <div className={s.act}>
                <Link className={s.btn} href={cta.href}>{cta.teks}</Link>
                {tamu ? <Link className={s.link} href="/login">Masuk</Link> : <a className={s.link} href="#alur">Ikuti satu pesanan</a>}
              </div>
            </div>
            <PrinterDemo />
          </div>
        </section>

        <AlurPesanan />

        <section className={s.end}>
          <div className={s.wrap}>
            <h2>Pasang menu malam ini. <span className={s.o}>Struk pertama besok pagi.</span></h2>
            <div>
              <p>Daftar sebagai penjual, isi porsi untuk besok, dan pesanan mulai masuk ke antrean dapur Anda.</p>
              <Link className={s.btn} href={cta.href}>{cta.teks}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.wrap}>© 2026 KateringKita · Pesanan di halaman ini hanya contoh.</div>
      </footer>
    </div>
  );
}
