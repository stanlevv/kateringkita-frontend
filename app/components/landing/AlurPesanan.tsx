"use client";

import { useEffect, useRef, useState } from "react";
import s from "./landing.module.css";

type Tahap = "held" | "confirmed" | "ready";

const BEATS: { s: Tahap; jam: string; judul: string; isi: string }[] = [
  { s: "held", jam: "07.42", judul: "Rani checkout, porsinya dikunci", isi: "Selama 5 menit porsi itu disimpan untuk Rani. Pembeli lain melihat sisa porsi yang benar, jadi tidak ada pesanan dobel." },
  { s: "confirmed", jam: "07.45", judul: "Anda terima, dapur mulai masak", isi: "Satu ketukan di antrean. Rani langsung dapat kabar bahwa pesanannya diproses." },
  { s: "ready", jam: "12.05", judul: "Siap, tinggal diambil", isi: "Rani tahu jam dan titik temunya. Anda tidak perlu membalas chat satu per satu." },
];
const LABEL: Record<Tahap, string> = { held: "DITAHAN", confirmed: "DIPROSES", ready: "SIAP DIAMBIL" };
const KAKI = { confirmed: ["Mulai dimasak", "07.45"], ready: ["Siap di Gedung C", "12.10"] };

// Satu struk yang statusnya berganti mengikuti ketukan yang sedang dibaca (gulir).
export function AlurPesanan() {
  const [tahap, setTahap] = useState<Tahap>("held");
  const [detik, setDetik] = useState(300);
  const beats = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) setTahap((e.target as HTMLElement).dataset.s as Tahap);
    }), { rootMargin: "-45% 0px -45% 0px" });
    beats.current.forEach((b) => b && io.observe(b));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (tahap !== "held" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setDetik((t) => (t > 0 ? t - 1 : 300)), 1000);
    return () => clearInterval(id);
  }, [tahap]);

  const [kecil, besar] = tahap === "held" ? ["Porsi dikunci selama", `${Math.floor(detik / 60)}:${String(detik % 60).padStart(2, "0")}`] : KAKI[tahap];

  return (
    <section className={s.flow} id="alur" aria-labelledby="alur-judul">
      <div className={s.wrap}>
        <div className={s.flowText}>
          <div>
            <p className={s.eyebrow}>Cara kerja</p>
            <h2 id="alur-judul">Satu pesanan dari checkout sampai diambil</h2>
          </div>
          {BEATS.map((b, i) => (
            <div key={b.s} className={s.beat} data-s={b.s} ref={(el) => { beats.current[i] = el; }}>
              <span className={s.n}>{b.jam}</span>
              <h3>{b.judul}</h3>
              <p>{b.isi}</p>
            </div>
          ))}
        </div>
        <div className={s.ticketCol}><div className={s.sticky}><div className={s.ticket}>
          <div className={s.tHead}><span>KK-20261102-4K0T</span><span className={`${s.st} ${s[tahap]}`} aria-live="polite">{LABEL[tahap]}</span></div>
          <div className={s.tRule} />
          <div className={s.tRow}><span>2× Nasi Ayam Bakar</span><span>30.000</span></div>
          <div className={s.tRow}><span>2× Es Teh</span><span>8.000</span></div>
          <div className={s.tRule} />
          <div className={`${s.tRow} ${s.tTot}`}><span>TOTAL</span><span>Rp38.000</span></div>
          <div className={s.tRule} />
          <div>Rani · Tunai<br />Ambil: Gedung C, 12.10</div>
          <div className={`${s.hold} ${tahap === "confirmed" ? s.holdConfirmed : tahap === "ready" ? s.holdReady : ""}`}><small>{kecil}</small><span>{besar}</span></div>
        </div></div></div>
      </div>
    </section>
  );
}
