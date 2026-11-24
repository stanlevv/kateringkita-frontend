// Komponen ChatNotifier: pemberitahuan pesan baru dari pembeli di semua halaman penjual (toast "Pesan baru dari
// pembeli · <kode>" dengan tombol Buka, ditambah bunyi pendek). Dipasang sekali di layout app/(dashboard)/layout.tsx.
// Baca data: cek berkala ke route GET /api/chat/belum-dibaca. Di /dashboard, data diserahkan DashboardLive dari
// sinkronnya sendiri (useReportUnreadChats), jadi tidak ada dua cek berkala sekaligus.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, dan timer.
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/app/components/ui/Toast";
import { readSoundEnabled } from "@/hooks/useNotifications";
import type { UnreadChats } from "@/types/order-chat";

const POLL_INTERVAL_MS = 15_000; // jeda cek pesan baru di luar /dashboard
const TOAST_DURATION_MS = 10_000; // cukup lama untuk sempat menekan Buka
const SOUND_URL = "/suara-chat.wav"; // berkas di public/
/** Alamat detail pesanan; kode di dalamnya = pesanan yang chatnya sedang dibuka. */
const ORDER_DETAIL_PATH = /^\/pesanan\/([^/]+)$/;

/**
 * Kode pesanan yang chatnya sedang dibuka, dibaca dari alamat halaman.
 * @param pathname alamat halaman sekarang (mis. /pesanan/KK-1)
 * @returns kode pesanan, atau null bila bukan halaman detail pesanan atau kodenya tidak bisa diurai (mis. `%E0`)
 */
function openOrderCode(pathname: string | null): string | null {
  const match = ORDER_DETAIL_PATH.exec(pathname ?? "");
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

type UnreadOrders = UnreadChats["orders"];
/** Sambungan dari halaman yang punya data chat sendiri: `claim` menghentikan cek berkala selama halaman tampil. */
type ChatFeed = { report: (orders: UnreadOrders) => void; claim: () => () => void };
const ChatFeedContext = createContext<ChatFeed | null>(null);

/** Memutar bunyi pendek. Peramban yang menolak (belum ada interaksi, tidak didukung) dibiarkan diam tanpa galat. */
function playChatSound() {
  try {
    void new Audio(SOUND_URL).play()?.catch(() => {});
  } catch {
    /* tanpa suara */
  }
}

/**
 * Membungkus halaman penjual dan memberi tahu saat jumlah pesan belum dibaca suatu pesanan bertambah dibanding cek
 * sebelumnya. Cek pertama hanya dicatat (tanpa toast). Pesanan yang chatnya sedang dibuka (/pesanan/<kode>) tidak
 * diberi toast. Cek tiap 15 detik, dilewati saat tab tersembunyi, dan langsung jalan lagi saat tab terlihat.
 * @param props.children isi layout penjual
 * @returns children di dalam penyedia data chat
 */
export function ChatNotifier({ children }: { children: ReactNode }) {
  // 1. Jumlah per pesanan dari cek sebelumnya (null = belum pernah), kode pesanan yang sedang dibuka, dan jumlah
  //    halaman yang sedang menyerahkan data chatnya sendiri.
  const router = useRouter();
  const pathname = usePathname();
  const previousCounts = useRef<Map<string, number> | null>(null);
  const openCode = useRef<string | null>(null);
  const claims = useRef(0);
  useEffect(() => {
    openCode.current = openOrderCode(pathname);
  }, [pathname]);

  // 2. Bandingkan dengan cek sebelumnya; tiap pesanan yang bertambah mendapat satu toast. Bunyi dan penyegaran badge
  //    cukup sekali per cek.
  const report = useCallback(
    (orders: UnreadOrders) => {
      // 1. Simpan jumlah terbaru; cek pertama hanya dicatat.
      const previous = previousCounts.current;
      previousCounts.current = new Map(orders.map((order) => [order.code, order.unread_count]));
      if (!previous) return;
      // 2. Pesanan yang jumlahnya bertambah, kecuali yang chatnya sedang dibuka.
      const increased = orders.filter(
        (order) => order.unread_count > (previous.get(order.code) ?? 0) && order.code !== openCode.current,
      );
      if (increased.length === 0) return;
      // 3. Satu toast per pesanan.
      for (const order of increased) {
        toast({
          tone: "info",
          message: `Pesan baru dari pembeli · ${order.code}`,
          action: { label: "Buka", onClick: () => router.push(`/pesanan/${encodeURIComponent(order.code)}#chat`) },
          duration: TOAST_DURATION_MS,
        });
      }
      // 4. Bunyi sekali. Di luar /dashboard (tidak ada halaman yang menyerahkan data), badge chat di sidebar
      //    disegarkan lewat router.refresh(); dashboard sudah menyegarkannya sendiri saat jumlah chat berubah.
      if (readSoundEnabled()) playChatSound();
      if (claims.current === 0) router.refresh();
    },
    [router],
  );

  // 3. Cek berkala sendiri, kecuali selama ada halaman yang menyerahkan datanya (claims > 0).
  useEffect(() => {
    let isStopped = false;
    let isPolling = false;
    async function poll() {
      // 1. Lewati bila berhenti, tab tersembunyi, cek sebelumnya belum selesai, atau dashboard sedang tampil.
      if (isStopped || isPolling || document.hidden || claims.current > 0) return;
      isPolling = true;
      // 2. Ambil ringkasan; galat atau sesi habis (dialihkan ke login) dilewati sampai cek berikutnya.
      try {
        const response = await fetch("/api/chat/belum-dibaca", { cache: "no-store" });
        if (!response.ok || response.redirected) return;
        const { data } = (await response.json()) as { data: UnreadChats };
        if (!isStopped) report(data.orders);
      } catch {
        /* dicoba lagi pada cek berikutnya */
      } finally {
        isPolling = false;
      }
    }
    const onVisibilityChange = () => {
      if (!document.hidden) void poll();
    };
    void poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      isStopped = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [report]);

  // 4. Sambungan untuk halaman yang punya data chat sendiri (useReportUnreadChats).
  const feed = useMemo<ChatFeed>(
    () => ({
      report,
      claim: () => {
        claims.current++;
        return () => {
          claims.current--;
        };
      },
    }),
    [report],
  );
  return <ChatFeedContext.Provider value={feed}>{children}</ChatFeedContext.Provider>;
}

/**
 * Dipakai halaman yang sudah punya cek berkala sendiri (dashboard): selama halaman tampil, ChatNotifier berhenti
 * mengecek dan memakai data dari halaman ini. Di luar ChatNotifier (mis. di test) tidak melakukan apa-apa.
 * @param orders rincian pesan belum dibaca per pesanan dari sinkron terakhir, atau null bila belum ada
 */
export function useReportUnreadChats(orders: UnreadOrders | null) {
  const feed = useContext(ChatFeedContext);
  useEffect(() => feed?.claim(), [feed]);
  useEffect(() => {
    if (orders) feed?.report(orders);
  }, [orders, feed]);
}
