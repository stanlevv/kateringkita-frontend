// Komponen TableOrderStatus: status pesanan dari meja di halaman /meja/pesanan/[code], tempat pembeli kembali dari
// halaman bayar Midtrans. Menampilkan judul status, hitung mundur dan tombol bayar selama menunggu pembayaran, langkah
// pesanan, rincian item, dan tautan pesan lagi.
// Data diambil lewat server action getTableOrderStatus (backend GET /guest/orders/:code) dengan token tamu dari
// localStorage; tanpa token itu (mis. dibuka di HP lain) pesanan tidak bisa dilihat. Data diambil ulang tiap 5 detik
// (polling) sampai pesanan berakhir.
// Status pesanan dari backend: holding (menunggu pembayaran), confirmed (lunas, diterima toko), cooking (sedang
// dimasak), ready (siap diantar), completed (selesai), cancelled (dibatalkan toko), expired (waktu bayar habis).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, dan localStorage.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, ChefHat, CircleX, Clock, PartyPopper, Utensils } from "lucide-react";
import { payTableOrder, getTableOrderStatus } from "@/app/actions/table";
import { Button } from "@/app/components/ui/Button";
import { cx, focusRing } from "@/app/components/ui/cx";
import { callAction } from "@/lib/action";
import { formatRupiah } from "@/lib/format";
import { subscribe, readGuestRaw, parseGuest } from "@/lib/table-storage";
import type { TableOrder } from "@/types/table";
import { TableMessage } from "../../TableMessage";

// Langkah yang ditampilkan berurutan; cancelled dan expired tidak punya langkah (ditampilkan sebagai gagal).
const STEPS = [
  { status: "holding", label: "Pembayaran" },
  { status: "confirmed", label: "Diterima toko" },
  { status: "cooking", label: "Sedang dimasak" },
  { status: "ready", label: "Siap diantar" },
  { status: "completed", label: "Selesai" },
] as const;
// Posisi tiap status di STEPS, untuk menentukan langkah yang sudah lewat dan yang sedang berjalan.
const STEP_INDEX: Record<string, number> = { holding: 0, confirmed: 1, cooking: 2, ready: 3, completed: 4 };
// Status akhir: setelah ini polling berhenti.
const FINAL_STATUSES = ["completed", "cancelled", "expired"];
// Judul dan penjelasan per status, selain holding yang teksnya bergantung pada apakah pembeli baru membayar.
const STATUS_TEXT: Record<string, { title: string; body: string }> = {
  confirmed: { title: "Pesanan diterima", body: "Pembayaran lunas. Dapur akan segera memasak pesananmu." },
  cooking: { title: "Sedang dimasak", body: "Pesananmu sedang disiapkan dapur." },
  ready: { title: "Siap!", body: "Pesananmu segera diantar ke meja." },
  completed: { title: "Selamat menikmati", body: "Terima kasih sudah memesan." },
  expired: { title: "Waktu bayar habis", body: "Pesanan dibatalkan karena belum dibayar. Silakan pesan lagi." },
  cancelled: {
    title: "Pesanan dibatalkan",
    body: "Pesanan ini dibatalkan toko. Bila sudah membayar, hubungi kasir untuk pengembalian dana.",
  },
};
// 125 -> "02:05" (menit:detik).
const formatCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Halaman status satu pesanan dari meja.
 * @param props.code kode pesanan dari URL
 * @returns null saat render di server; TableMessage bila token tamu tidak ada atau pesanan gagal dimuat; teks
 *   "Memuat pesanan…" sebelum data pertama; selain itu halaman status lengkap
 */
export function TableOrderStatus({ code }: { code: string }) {
  // 1. Baca data tamu dari localStorage lewat useSyncExternalStore (hook React untuk data di luar React).
  //    undefined = render di server (belum tahu); null = pesanan dibuat di perangkat lain.
  const rawGuest = useSyncExternalStore(
    subscribe,
    () => readGuestRaw(code),
    () => undefined,
  );
  const guest = useMemo(() => (rawGuest === undefined ? undefined : parseGuest(rawGuest)), [rawGuest]);
  // 2. Kembali dari Midtrans membawa ?transaction_status=...; notifikasi lunas ke backend bisa tiba beberapa detik
  //    kemudian, jadi selama itu tampil "Memeriksa pembayaran…" alih-alih tombol bayar.
  const justPaid = useSyncExternalStore(
    subscribe,
    () => /transaction_status=(settlement|capture)/.test(window.location.search),
    () => false,
  );
  // 3. State pesanan, galat, sisa waktu bayar (detik), dan proses bayar. `finishedRef` menandai status akhir.
  const [order, setOrder] = useState<TableOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const finishedRef = useRef(false);

  // 4. Ambil status terbaru; tidak dipanggil lagi bila pesanan sudah berakhir.
  const loadOrder = useCallback(async () => {
    if (!guest || finishedRef.current) return;
    const result = await callAction(() => getTableOrderStatus(code, guest.tamu));
    if ("error" in result) return setErrorMessage(result.error.message);
    setErrorMessage(null);
    setOrder(result.data);
    setSecondsLeft(result.data.seconds_left);
    finishedRef.current = FINAL_STATUSES.includes(result.data.status);
  }, [code, guest]);

  // 5. Polling: ambil sekali segera, lalu tiap 5 detik sampai selesai, dibatalkan, atau kedaluwarsa.
  useEffect(() => {
    if (!guest) return;
    const firstLoad = setTimeout(() => void loadOrder(), 0);
    const poller = setInterval(() => void loadOrder(), 5000);
    return () => {
      clearTimeout(firstLoad);
      clearInterval(poller);
    };
  }, [guest, loadOrder]);

  // 6. Hitung mundur sisa waktu bayar, berkurang satu tiap detik sampai 0.
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const timer = setTimeout(
      () => setSecondsLeft((seconds) => (seconds === null ? seconds : Math.max(seconds - 1, 0))),
      1000,
    );
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // 7. Tombol bayar: pakai tautan bayar yang sudah ada, atau minta tautan baru lewat server action payTableOrder.
  async function pay() {
    if (!guest || !order) return;
    if (order.payment_url) return window.location.assign(order.payment_url);
    setPaying(true);
    const result = await callAction(() =>
      payTableOrder(code, guest.tamu, `${window.location.origin}/meja/pesanan/${code}`),
    );
    if ("data" in result) return window.location.assign(result.data.payment_url);
    setPaying(false);
    setErrorMessage(result.error.message);
  }

  // 8. Layar pengganti: belum tahu, tanpa token tamu, gagal dimuat, atau sedang memuat.
  if (guest === undefined) return null;
  if (guest === null) {
    return (
      <TableMessage
        title="Pesanan tidak bisa dibuka di sini"
        body="Status pesanan hanya bisa dilihat dari HP yang dipakai memesan. Tanyakan ke kasir bila perlu."
      />
    );
  }
  if (!order) {
    return errorMessage ? (
      <TableMessage
        title="Pesanan belum bisa dimuat"
        body={errorMessage}
        action={<Button onClick={() => void loadOrder()}>Coba lagi</Button>}
      />
    ) : (
      <p className="p-8 text-center text-ink-muted">Memuat pesanan…</p>
    );
  }

  // 9. Teks dan ikon sesuai status.
  const awaitingPayment = order.status === "holding";
  const statusText = awaitingPayment
    ? justPaid
      ? { title: "Memeriksa pembayaran…", body: "Pembayaranmu sedang dikonfirmasi. Halaman ini berganti otomatis." }
      : { title: "Menunggu pembayaran", body: "Selesaikan pembayaran agar pesanan diteruskan ke dapur." }
    : STATUS_TEXT[order.status];
  const failed = order.status === "expired" || order.status === "cancelled";
  const StatusIcon = failed
    ? CircleX
    : order.status === "completed"
      ? PartyPopper
      : order.status === "ready"
        ? Utensils
        : order.status === "cooking"
          ? ChefHat
          : awaitingPayment
            ? Clock
            : Check;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{order.merchant.business_name}</span>
        <span className="rounded-md border-2 border-dashed border-ink/60 px-2 py-0.5 font-mono font-bold">
          MEJA {order.table.label}
        </span>
      </div>

      <section
        aria-live="polite"
        className={cx(
          "flex flex-col items-center gap-3 rounded-2xl p-6 text-center",
          failed ? "bg-danger-bg" : "bg-gradient-to-br from-accent to-accent-pressed",
        )}
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-surface">
          <StatusIcon aria-hidden className={cx("size-8", failed ? "text-danger" : "text-primary")} />
        </span>
        <h1 className="font-display text-2xl font-bold">{statusText.title}</h1>
        <p className={failed ? "text-danger" : "text-ink/80"}>{statusText.body}</p>
        {awaitingPayment && secondsLeft !== null && secondsLeft > 0 && !justPaid && (
          <p className="font-mono text-lg font-bold">Bayar dalam {formatCountdown(secondsLeft)}</p>
        )}
        {awaitingPayment && !justPaid && (
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            loading={paying}
            loadingText="Membuka halaman bayar…"
            onClick={pay}
          >
            Bayar {formatRupiah(order.total)}
          </Button>
        )}
      </section>

      {errorMessage && (
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {!failed && (
        <ol className="flex flex-col gap-0">
          {STEPS.map((step, i) => {
            // pesanan selesai: langkah terakhir pun tercentang (STEP_INDEX completed = indeks langkah terakhir)
            const done =
              order.status === "completed" ||
              STEP_INDEX[order.status] > i ||
              (i === 0 && order.payment_status === "paid");
            const current = STEP_INDEX[order.status] === i && !done;
            return (
              <li key={step.status} className="flex items-center gap-3 py-1.5">
                <span
                  className={cx(
                    "flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                    done
                      ? "border-success bg-success text-surface"
                      : current
                        ? "border-accent bg-primary-soft text-primary"
                        : "border-line text-ink-muted",
                  )}
                >
                  {done ? <Check aria-hidden className="size-4" /> : i + 1}
                </span>
                <span className={cx(done || current ? "font-semibold text-ink" : "text-ink-muted")}>{step.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-2 font-mono text-xs text-ink-muted">{order.code}</p>
        <ul className="flex flex-col gap-2">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3 text-sm">
              <span>
                {item.qty}× {item.menu_name}
                {item.options.length > 0 && (
                  <span className="text-ink-muted"> (+{item.options.map((option) => option.name).join(", ")})</span>
                )}
              </span>
              <span className="font-mono">{formatRupiah(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-1 border-t border-dashed border-line-strong pt-3 text-sm">
          {order.service_fee > 0 && (
            <p className="flex justify-between text-ink-muted">
              <span>Biaya layanan</span>
              <span className="font-mono">{formatRupiah(order.service_fee)}</span>
            </p>
          )}
          <p className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="font-mono">{formatRupiah(order.total)}</span>
          </p>
        </div>
      </section>

      <Link
        href={`/meja/${guest.meja}`}
        className={cx(
          "inline-flex min-h-11 items-center justify-center rounded-xl border border-line-strong bg-surface font-semibold text-ink hover:bg-subtle",
          focusRing,
        )}
      >
        {failed || order.status === "completed" ? "Pesan lagi" : "Tambah pesanan lain"}
      </Link>
    </main>
  );
}
