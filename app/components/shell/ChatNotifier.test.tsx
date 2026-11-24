// Test ChatNotifier: toast "Pesan baru dari pembeli" hanya saat jumlah belum dibaca suatu pesanan bertambah (tidak saat
// pertama dimuat, tidak untuk chat yang sedang dibuka), tombol Buka, bunyi sekali per cek dan yang gagal tidak
// melempar, penyegaran badge, cek berhenti saat tab tersembunyi, dan dashboard menyerahkan data sinkronnya sendiri.
// fetch, Audio, router, dan toast dipalsukan.
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UnreadChats } from "@/types/order-chat";

const push = vi.fn();
const refresh = vi.fn();
// Router yang sama di setiap render, seperti di Next.js.
const router = { push, refresh };
let pathname = "/menu";
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => pathname }));
const toast = vi.fn();
vi.mock("@/app/components/ui/Toast", () => ({ toast: (options: unknown) => toast(options) }));
import { ChatNotifier, useReportUnreadChats } from "./ChatNotifier";

type UnreadOrders = UnreadChats["orders"];
const unread = (counts: Record<string, number>): UnreadOrders =>
  Object.entries(counts).map(([code, unread_count]) => ({
    code,
    unread_count,
    last_message_at: "2026-11-25T03:00:00.000Z",
  }));
const fetchMock = vi.fn();
// Jawaban berurutan untuk tiap cek; jawaban terakhir dipakai terus.
const serveUnread = (...replies: UnreadOrders[]) => {
  let call = 0;
  fetchMock.mockImplementation(async () => {
    const orders = replies[Math.min(call++, replies.length - 1)];
    return new Response(JSON.stringify({ data: { total: orders.length, orders } }));
  });
};
const play = vi.fn();
const AudioMock = vi.fn(function () {
  return { play };
});
const setHidden = (hidden: boolean) => Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
const advance = (milliseconds: number) => act(() => vi.advanceTimersByTimeAsync(milliseconds));
const renderNotifier = (children: React.ReactNode = null) => render(<ChatNotifier>{children}</ChatNotifier>);
/** Pesan semua toast yang sudah dipanggil. */
const toastMessages = () => toast.mock.calls.map(([options]) => (options as { message: string }).message);
const TOAST_KK2 = "Pesan baru dari pembeli · KK-2";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("Audio", AudioMock);
  fetchMock.mockReset();
  AudioMock.mockClear();
  play.mockReset().mockResolvedValue(undefined);
  push.mockReset();
  refresh.mockReset();
  toast.mockReset();
  pathname = "/menu";
  setHidden(false);
  localStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ChatNotifier", () => {
  it("cek pertama hanya dicatat; jumlah bertambah -> toast, bunyi, dan Buka ke /pesanan/<kode>#chat", async () => {
    serveUnread(unread({ "KK-1": 1 }), unread({ "KK-1": 1, "KK-2": 2 }));
    renderNotifier();
    await advance(0);
    expect(fetchMock).toHaveBeenCalledWith("/api/chat/belum-dibaca", { cache: "no-store" });
    expect(toast).not.toHaveBeenCalled();
    expect(AudioMock).not.toHaveBeenCalled();
    await advance(15_000);
    expect(toastMessages()).toEqual([TOAST_KK2]);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "info", action: expect.objectContaining({ label: "Buka" }) }),
    );
    expect(AudioMock).toHaveBeenCalledWith("/suara-chat.wav");
    expect(play).toHaveBeenCalledTimes(1);
    toast.mock.calls[0][0].action.onClick();
    expect(push).toHaveBeenCalledWith("/pesanan/KK-2#chat");
  });
  it("dua pesanan bertambah sekaligus -> dua toast, bunyi sekali, badge disegarkan sekali", async () => {
    serveUnread(unread({ "KK-1": 1 }), unread({ "KK-1": 2, "KK-2": 1 }));
    renderNotifier();
    await advance(15_000);
    expect(toastMessages()).toEqual(["Pesan baru dari pembeli · KK-1", TOAST_KK2]);
    expect(play).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("jumlah turun ke 0 lalu naik lagi -> toast", async () => {
    serveUnread(unread({ "KK-2": 2 }), unread({}), unread({ "KK-2": 1 }));
    renderNotifier();
    await advance(15_000);
    expect(toast).not.toHaveBeenCalled();
    await advance(15_000);
    expect(toastMessages()).toEqual([TOAST_KK2]);
  });
  it("alamat dengan kode rusak (%E0) -> tidak jatuh, toast tetap jalan", async () => {
    pathname = "/pesanan/%E0";
    serveUnread(unread({}), unread({ "KK-2": 1 }));
    renderNotifier();
    await advance(15_000);
    expect(toastMessages()).toEqual([TOAST_KK2]);
  });
  it("jumlah tetap atau berkurang -> tanpa toast", async () => {
    serveUnread(unread({ "KK-1": 3 }), unread({ "KK-1": 3 }), unread({ "KK-1": 1 }));
    renderNotifier();
    await advance(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(toast).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
  it("chat pesanan yang sedang dibuka -> tanpa toast untuk pesanan itu", async () => {
    pathname = "/pesanan/KK-2";
    serveUnread(unread({}), unread({ "KK-2": 1 }));
    renderNotifier();
    await advance(15_000);
    expect(toast).not.toHaveBeenCalled();
    expect(AudioMock).not.toHaveBeenCalled();
  });
  it("tab tersembunyi -> tidak mengecek; terlihat lagi -> langsung mengecek", async () => {
    serveUnread(unread({}));
    setHidden(true);
    renderNotifier();
    await advance(45_000);
    expect(fetchMock).not.toHaveBeenCalled();
    setHidden(false);
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("bunyi gagal (Audio melempar atau play ditolak) -> toast tetap tampil tanpa galat", async () => {
    serveUnread(unread({}), unread({ "KK-2": 1 }), unread({ "KK-2": 2 }));
    play.mockRejectedValue(new Error("NotAllowedError"));
    renderNotifier();
    await advance(15_000);
    expect(toastMessages()).toEqual([TOAST_KK2]);
    AudioMock.mockImplementationOnce(() => {
      throw new Error("tidak didukung");
    });
    await advance(15_000);
    expect(toastMessages()).toEqual([TOAST_KK2, TOAST_KK2]);
  });
  it("suara notifikasi dimatikan penjual -> toast tanpa bunyi", async () => {
    localStorage.setItem("kk_suara", "0");
    serveUnread(unread({}), unread({ "KK-2": 1 }));
    renderNotifier();
    await advance(15_000);
    expect(toastMessages()).toEqual([TOAST_KK2]);
    expect(AudioMock).not.toHaveBeenCalled();
  });
  it("cek gagal -> tanpa toast dan cek berikutnya tetap berjalan", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    renderNotifier();
    await advance(15_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(toast).not.toHaveBeenCalled();
  });
  it("dashboard menyerahkan data sinkronnya -> tidak ada cek sendiri, toast dari data dashboard", async () => {
    let report: UnreadOrders | null = null;
    function FakeDashboard() {
      useReportUnreadChats(report);
      return null;
    }
    serveUnread(unread({}));
    const view = renderNotifier(<FakeDashboard />);
    await advance(30_000);
    expect(fetchMock).not.toHaveBeenCalled();
    report = unread({ "KK-2": 1 });
    view.rerender(
      <ChatNotifier>
        <FakeDashboard />
      </ChatNotifier>,
    );
    expect(toast).not.toHaveBeenCalled();
    report = unread({ "KK-2": 3 });
    view.rerender(
      <ChatNotifier>
        <FakeDashboard />
      </ChatNotifier>,
    );
    expect(toastMessages()).toEqual([TOAST_KK2]);
    expect(refresh).not.toHaveBeenCalled(); // dashboard menyegarkan badge sendiri
  });
});
