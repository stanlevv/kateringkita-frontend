"use client";

import { useEffect, useState } from "react";
import styles from "./landing.module.css";

// Data ilustrasi untuk animasi halaman pembuka, bukan data dari backend.
const ORDERS = [
  { code: "KK-4K0T", time: "07.42", name: "Rani", qty: 2, pickup: "Gedung C, 12.10", payment: "Tunai" },
  { code: "KK-9PLA", time: "07.44", name: "Dimas", qty: 3, pickup: "Perpustakaan, 12.30", payment: "Bayar online" },
  { code: "KK-2HXR", time: "07.47", name: "Ayu", qty: 1, pickup: "Gedung C, 12.10", payment: "Tunai" },
  { code: "KK-7TQE", time: "07.51", name: "Fajar", qty: 4, pickup: "Masjid Kampus, 11.45", payment: "VA" },
];
const ITEM_NAME = "Nasi Ayam Bakar",
  PRICE = 15000,
  TOTAL_PORTIONS = 40;
const PAUSE_MS = 1400,
  PRINT_MS = 1600;
const formatThousands = (amount: number) => amount.toLocaleString("id-ID");

// Printer struk + papan sisa porsi: 4 pesanan tercetak lalu berhenti (tombol cetak lagi).
export function PrinterDemo() {
  const [run, setRun] = useState(0);
  const [printed, setPrinted] = useState(0);
  const [printing, setPrinting] = useState(false);
  const [remaining, setRemaining] = useState(TOTAL_PORTIONS);

  useEffect(() => {
    const timers: number[] = [];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timers.push(
        window.setTimeout(() => {
          setPrinted(ORDERS.length);
          setRemaining(TOTAL_PORTIONS - ORDERS.reduce((sum, order) => sum + order.qty, 0));
        }, 0),
      );
      return () => timers.forEach(clearTimeout);
    }
    let elapsedMs = 0,
      portionsLeft = TOTAL_PORTIONS;
    ORDERS.forEach((order, i) => {
      elapsedMs += PAUSE_MS;
      timers.push(
        window.setTimeout(() => {
          setPrinted(i + 1);
          setPrinting(true);
        }, elapsedMs),
      );
      elapsedMs += PRINT_MS;
      portionsLeft -= order.qty;
      const remainingAfter = portionsLeft;
      timers.push(
        window.setTimeout(() => {
          setPrinting(false);
          setRemaining(remainingAfter);
        }, elapsedMs),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [run]);

  const digits = String(remaining).padStart(2, "0");
  const done = printed === ORDERS.length && !printing;
  const shown = ORDERS.slice(0, printed);

  return (
    <div className={styles.printerCol} aria-label="Contoh struk pesanan yang masuk">
      <div className={styles.board}>
        <div className={styles.flaps} aria-hidden>
          {[...digits].map((digit, i) => (
            <span key={`${i}-${digit}`} className={styles.flap}>
              {digit}
            </span>
          ))}
          <span className={styles.of}>/</span>
          {[...String(TOTAL_PORTIONS)].map((digit, i) => (
            <span key={i} className={`${styles.flap} ${styles.flapSm}`}>
              {digit}
            </span>
          ))}
        </div>
        <div className={styles.lbl} aria-live="polite">
          <b>Sisa {remaining} porsi</b>
          {ITEM_NAME}, hari ini
        </div>
      </div>
      <div className={`${styles.printer} ${printing ? styles.on : ""}`}>
        <span className={styles.led}>
          <i />
          {printing ? "Mencetak pesanan baru" : "Menunggu pesanan"}
        </span>
        <span>Dapur Bu Sari</span>
        <span className={styles.slot} />
      </div>
      <div className={styles.feed}>
        {shown.map((order, i) => {
          const depth = shown.length - 1 - i;
          const style =
            depth === 0
              ? { zIndex: 5 }
              : {
                  zIndex: 1,
                  opacity: depth > 2 ? 0 : 1,
                  transform: `translateY(${depth * 26}px) rotate(${depth % 2 ? 1.6 : -1.4}deg) scale(${1 - depth * 0.04})`,
                };
          return (
            <div
              key={`${run}-${order.code}`}
              style={style}
              className={`${styles.ticket} ${depth > 0 ? styles.old : printing ? styles.printing : ""}`}
            >
              <div className={styles.tHead}>
                <span>{order.code}</span>
                <span>{order.time}</span>
              </div>
              <div className={styles.tRule} />
              <div className={styles.tRow}>
                <span>
                  {order.qty}× {ITEM_NAME}
                </span>
                <span>{formatThousands(order.qty * PRICE)}</span>
              </div>
              <div className={styles.tRule} />
              <div className={`${styles.tRow} ${styles.tTot}`}>
                <span>TOTAL</span>
                <span>Rp{formatThousands(order.qty * PRICE)}</span>
              </div>
              <div className={styles.tRule} />
              <div>
                {order.name} · {order.payment}
                <br />
                Ambil: {order.pickup}
              </div>
              <span className={styles.stamp}>PORSI DIKUNCI 5:00</span>
            </div>
          );
        })}
      </div>
      {done && (
        <button
          type="button"
          className={styles.again}
          onClick={() => {
            setPrinted(0);
            setRemaining(TOTAL_PORTIONS);
            setRun((previousRun) => previousRun + 1);
          }}
        >
          Cetak pesanan lagi
        </button>
      )}
    </div>
  );
}
