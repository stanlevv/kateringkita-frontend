"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./landing.module.css";

type Stage = "held" | "confirmed" | "ready";

const BEATS: { stage: Stage; time: string; title: string; body: string }[] = [
  {
    stage: "held",
    time: "07.42",
    title: "Rani checkout, porsinya dikunci",
    body: "Selama 5 menit porsi itu disimpan untuk Rani. Pembeli lain melihat sisa porsi yang benar, jadi tidak ada pesanan dobel.",
  },
  {
    stage: "confirmed",
    time: "07.45",
    title: "Anda terima, dapur mulai masak",
    body: "Satu ketukan di antrean. Rani langsung dapat kabar bahwa pesanannya diproses.",
  },
  {
    stage: "ready",
    time: "12.05",
    title: "Siap, tinggal diambil",
    body: "Rani tahu jam dan titik temunya. Anda tidak perlu membalas chat satu per satu.",
  },
];
const STAGE_LABELS: Record<Stage, string> = { held: "DITAHAN", confirmed: "DIPROSES", ready: "SIAP DIAMBIL" };
const FOOTER_TEXT = { confirmed: ["Mulai dimasak", "07.45"], ready: ["Siap di Gedung C", "12.10"] };

// Satu struk yang statusnya berganti mengikuti ketukan yang sedang dibaca (gulir).
export function OrderFlow() {
  const [stage, setStage] = useState<Stage>("held");
  const [secondsLeft, setSecondsLeft] = useState(300);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) setStage((entry.target as HTMLElement).dataset.stage as Stage);
        }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    beatRefs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (stage !== "held" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const intervalId = window.setInterval(() => setSecondsLeft((seconds) => (seconds > 0 ? seconds - 1 : 300)), 1000);
    return () => clearInterval(intervalId);
  }, [stage]);

  const [footerCaption, footerValue] =
    stage === "held"
      ? ["Porsi dikunci selama", `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`]
      : FOOTER_TEXT[stage];

  return (
    <section className={styles.flow} id="alur" aria-labelledby="alur-judul">
      <div className={styles.wrap}>
        <div className={styles.flowText}>
          <div>
            <p className={styles.eyebrow}>Cara kerja</p>
            <h2 id="alur-judul">Satu pesanan dari checkout sampai diambil</h2>
          </div>
          {BEATS.map((beat, i) => (
            <div
              key={beat.stage}
              className={styles.beat}
              data-stage={beat.stage}
              ref={(element) => {
                beatRefs.current[i] = element;
              }}
            >
              <span className={styles.n}>{beat.time}</span>
              <h3>{beat.title}</h3>
              <p>{beat.body}</p>
            </div>
          ))}
        </div>
        <div className={styles.ticketCol}>
          <div className={styles.sticky}>
            <div className={styles.ticket}>
              <div className={styles.tHead}>
                <span>KK-20261102-4K0T</span>
                <span className={`${styles.st} ${styles[stage]}`} aria-live="polite">
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              <div className={styles.tRule} />
              <div className={styles.tRow}>
                <span>2× Nasi Ayam Bakar</span>
                <span>30.000</span>
              </div>
              <div className={styles.tRow}>
                <span>2× Es Teh</span>
                <span>8.000</span>
              </div>
              <div className={styles.tRule} />
              <div className={`${styles.tRow} ${styles.tTot}`}>
                <span>TOTAL</span>
                <span>Rp38.000</span>
              </div>
              <div className={styles.tRule} />
              <div>
                Rani · Tunai
                <br />
                Ambil: Gedung C, 12.10
              </div>
              <div
                className={`${styles.hold} ${stage === "confirmed" ? styles.holdConfirmed : stage === "ready" ? styles.holdReady : ""}`}
              >
                <small>{footerCaption}</small>
                <span>{footerValue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
