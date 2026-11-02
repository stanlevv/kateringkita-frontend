"use client";

import { useEffect, useState } from "react";
import s from "./landing.module.css";

// Data ilustrasi untuk animasi halaman pembuka, bukan data dari backend.
const ORDERS = [
  { code: "KK-4K0T", jam: "07.42", nama: "Rani", qty: 2, ambil: "Gedung C, 12.10", bayar: "Tunai" },
  { code: "KK-9PLA", jam: "07.44", nama: "Dimas", qty: 3, ambil: "Perpustakaan, 12.30", bayar: "QRIS" },
  { code: "KK-2HXR", jam: "07.47", nama: "Ayu", qty: 1, ambil: "Gedung C, 12.10", bayar: "Tunai" },
  { code: "KK-7TQE", jam: "07.51", nama: "Fajar", qty: 4, ambil: "Masjid Kampus, 11.45", bayar: "QRIS" },
];
const ITEM = "Nasi Ayam Bakar", HARGA = 15000, PORSI = 40;
const JEDA = 1400, CETAK = 1600;
const rp = (n: number) => n.toLocaleString("id-ID");

// Printer struk + papan sisa porsi: 4 pesanan tercetak lalu berhenti (tombol cetak lagi).
export function PrinterDemo() {
  const [run, setRun] = useState(0);
  const [printed, setPrinted] = useState(0);
  const [printing, setPrinting] = useState(false);
  const [sisa, setSisa] = useState(PORSI);

  useEffect(() => {
    const timers: number[] = [];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timers.push(window.setTimeout(() => { setPrinted(ORDERS.length); setSisa(PORSI - ORDERS.reduce((a, o) => a + o.qty, 0)); }, 0));
      return () => timers.forEach(clearTimeout);
    }
    let at = 0, left = PORSI;
    ORDERS.forEach((o, i) => {
      at += JEDA;
      timers.push(window.setTimeout(() => { setPrinted(i + 1); setPrinting(true); }, at));
      at += CETAK;
      left -= o.qty;
      const now = left;
      timers.push(window.setTimeout(() => { setPrinting(false); setSisa(now); }, at));
    });
    return () => timers.forEach(clearTimeout);
  }, [run]);

  const digits = String(sisa).padStart(2, "0");
  const done = printed === ORDERS.length && !printing;
  const shown = ORDERS.slice(0, printed);

  return (
    <div className={s.printerCol} aria-label="Contoh struk pesanan yang masuk">
      <div className={s.board}>
        <div className={s.flaps} aria-hidden>
          {[...digits].map((d, i) => <span key={`${i}-${d}`} className={s.flap}>{d}</span>)}
          <span className={s.of}>/</span>
          {[...String(PORSI)].map((d, i) => <span key={i} className={`${s.flap} ${s.flapSm}`}>{d}</span>)}
        </div>
        <div className={s.lbl} aria-live="polite"><b>Sisa {sisa} porsi</b>{ITEM}, hari ini</div>
      </div>
      <div className={`${s.printer} ${printing ? s.on : ""}`}>
        <span className={s.led}><i />{printing ? "Mencetak pesanan baru" : "Menunggu pesanan"}</span>
        <span>Dapur Bu Sari</span>
        <span className={s.slot} />
      </div>
      <div className={s.feed}>
        {shown.map((o, i) => {
          const d = shown.length - 1 - i;
          const style = d === 0 ? { zIndex: 5 } : { zIndex: 1, opacity: d > 2 ? 0 : 1, transform: `translateY(${d * 26}px) rotate(${d % 2 ? 1.6 : -1.4}deg) scale(${1 - d * 0.04})` };
          return (
            <div key={`${run}-${o.code}`} style={style} className={`${s.ticket} ${d > 0 ? s.old : printing ? s.printing : ""}`}>
              <div className={s.tHead}><span>{o.code}</span><span>{o.jam}</span></div>
              <div className={s.tRule} />
              <div className={s.tRow}><span>{o.qty}× {ITEM}</span><span>{rp(o.qty * HARGA)}</span></div>
              <div className={s.tRule} />
              <div className={`${s.tRow} ${s.tTot}`}><span>TOTAL</span><span>Rp{rp(o.qty * HARGA)}</span></div>
              <div className={s.tRule} />
              <div>{o.nama} · {o.bayar}<br />Ambil: {o.ambil}</div>
              <span className={s.stamp}>PORSI DIKUNCI 5:00</span>
            </div>
          );
        })}
      </div>
      {done && <button type="button" className={s.again} onClick={() => { setPrinted(0); setSisa(PORSI); setRun((r) => r + 1); }}>Cetak pesanan lagi</button>}
    </div>
  );
}
