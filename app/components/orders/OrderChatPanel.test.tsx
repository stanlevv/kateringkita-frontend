// Test OrderChatPanel: gelembung pembeli/penjual, pesan cepat, tanda "Dibaca", mode hanya-baca, kiriman 409, cek
// berkala (after_id dari hasil GET saja, berhenti saat tab tersembunyi), tandai dibaca, foto, laporan, dan gulir ke
// panel dari tautan #chat.
// fetch, server action, unggah foto, dan router dipalsukan (vi.mock / vi.stubGlobal).
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage, ChatState } from "@/types/order-chat";

const sendChatMessage = vi.fn();
const markChatRead = vi.fn();
const reportChat = vi.fn();
const requestChatUpload = vi.fn();
vi.mock("@/app/actions/order-chat", () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
  markChatRead: (...args: unknown[]) => markChatRead(...args),
  reportChat: (...args: unknown[]) => reportChat(...args),
  requestChatUpload: (...args: unknown[]) => requestChatUpload(...args),
}));
const uploadPhoto = vi.fn();
vi.mock("@/lib/upload", () => ({ uploadPhoto: (...args: unknown[]) => uploadPhoto(...args) }));
const refresh = vi.fn();
// Router yang sama di setiap render, seperti di Next.js; objek baru tiap render akan menjalankan ulang efek tandai dibaca.
const router = { refresh };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
import { Toaster } from "@/app/components/ui/Toast";
import { OrderChatPanel } from "./OrderChatPanel";

const OPEN_CHAT: ChatState = {
  available: true,
  is_open: true,
  closed_reason: null,
  unread_count: 0,
  other_party_last_read_id: null,
  reported_by_me: false,
};
const message = (id: number, sender_role: ChatMessage["sender_role"], body: string | null): ChatMessage => ({
  id,
  sender_role,
  body,
  image_url: null,
  created_at: "2026-11-24T03:00:00.000Z",
});
const fetchMock = vi.fn();
// Jawaban berurutan untuk tiap GET; jawaban terakhir dipakai terus.
const serveChats = (...replies: { messages: ChatMessage[]; chat?: Partial<ChatState> }[]) => {
  let call = 0;
  fetchMock.mockImplementation(async () => {
    const reply = replies[Math.min(call++, replies.length - 1)];
    return new Response(JSON.stringify({ data: { messages: reply.messages, chat: { ...OPEN_CHAT, ...reply.chat } } }));
  });
};
const setHidden = (hidden: boolean) => Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
const pollNow = () => act(async () => void document.dispatchEvent(new Event("visibilitychange")));
const renderPanel = () =>
  render(
    <>
      <Toaster />
      <OrderChatPanel code="KK-1" />
    </>,
  );

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  setHidden(false);
  for (const action of [sendChatMessage, markChatRead, reportChat, requestChatUpload, uploadPhoto, refresh])
    action.mockReset();
  markChatRead.mockResolvedValue({ data: true });
});
afterEach(() => vi.unstubAllGlobals());

describe("tampilan pesan", () => {
  it("gelembung pembeli di kiri dan penjual di kanan", async () => {
    serveChats({ messages: [message(1, "customer", "Saya sudah di titik temu"), message(2, "merchant", "Oke")] });
    renderPanel();
    const customerBubble = (await screen.findByText("Saya sudah di titik temu")).closest("li")!;
    const merchantBubble = screen.getByText("Oke").closest("li")!;
    expect(customerBubble).toHaveClass("self-start");
    expect(merchantBubble).toHaveClass("self-end");
    expect(fetchMock).toHaveBeenCalledWith("/api/pesanan/KK-1/chat", expect.objectContaining({ cache: "no-store" }));
  });
  it("Dibaca muncul pada pesan terakhir penjual bila other_party_last_read_id >= id pesan itu", async () => {
    serveChats({
      messages: [message(1, "merchant", "Satu"), message(2, "merchant", "Dua")],
      chat: { other_party_last_read_id: 2 },
    });
    renderPanel();
    const lastBubble = (await screen.findByText("Dua")).closest("li")!;
    expect(within(lastBubble).getByText("Dibaca")).toBeInTheDocument();
    expect(screen.getAllByText("Dibaca")).toHaveLength(1);
  });
  it("Dibaca tidak muncul bila pembeli baru membaca pesan sebelumnya", async () => {
    serveChats({
      messages: [message(1, "merchant", "Satu"), message(2, "merchant", "Dua")],
      chat: { other_party_last_read_id: 1 },
    });
    renderPanel();
    await screen.findByText("Dua");
    expect(screen.queryByText("Dibaca")).not.toBeInTheDocument();
  });
  it("chat tertutup: kotak ketik diganti teks penutupan, riwayat tetap tampil", async () => {
    serveChats({
      messages: [message(1, "customer", "Terima kasih")],
      chat: { is_open: false, closed_reason: "finished" },
    });
    renderPanel();
    expect(await screen.findByText("Terima kasih")).toBeInTheDocument();
    expect(screen.getByText("Chat sudah ditutup karena pesanan selesai atau dibatalkan.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Tulis pesan" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pesanan sudah siap" })).not.toBeInTheDocument();
  });
  it("pesanan meja: chat tidak tersedia", async () => {
    serveChats({ messages: [], chat: { available: false, is_open: false, closed_reason: "unavailable" } });
    renderPanel();
    expect(await screen.findByText("Chat tidak tersedia untuk pesanan meja.")).toBeInTheDocument();
  });
});

describe("kirim pesan", () => {
  it("tombol Pesanan sudah siap mengirim teks itu dan pesannya langsung tampil", async () => {
    serveChats({ messages: [] });
    sendChatMessage.mockResolvedValue({ data: message(5, "merchant", "Pesanan sudah siap") });
    renderPanel();
    await userEvent.click(await screen.findByRole("button", { name: "Pesanan sudah siap" }));
    expect(sendChatMessage).toHaveBeenCalledWith("KK-1", { body: "Pesanan sudah siap" });
    expect((await screen.findByText("Pesanan sudah siap", { selector: "p" })).closest("li")).toHaveClass("self-end");
  });
  it("kotak ketik mengirim teks lalu dikosongkan", async () => {
    serveChats({ messages: [] });
    sendChatMessage.mockResolvedValue({ data: message(5, "merchant", "Ditunggu ya") });
    renderPanel();
    const input = await screen.findByRole("textbox", { name: "Tulis pesan" });
    await userEvent.type(input, "Ditunggu ya{Enter}");
    expect(sendChatMessage).toHaveBeenCalledWith("KK-1", { body: "Ditunggu ya" });
    await waitFor(() => expect(input).toHaveValue(""));
  });
  it("kiriman yang mendapat 409 membuat panel hanya-baca tanpa galat yang tidak tertangkap", async () => {
    serveChats({ messages: [] });
    sendChatMessage.mockResolvedValue({
      error: { code: "CHAT_CLOSED", message: "Chat sudah ditutup karena pesanan selesai atau dibatalkan." },
    });
    renderPanel();
    await userEvent.type(await screen.findByRole("textbox", { name: "Tulis pesan" }), "Halo{Enter}");
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Tulis pesan" })).not.toBeInTheDocument());
    expect(screen.getAllByText("Chat sudah ditutup karena pesanan selesai atau dibatalkan.").length).toBeGreaterThan(0);
  });
  it("server action melempar (jaringan putus) -> toast galat, teks tidak hilang", async () => {
    serveChats({ messages: [] });
    sendChatMessage.mockRejectedValue(new Error("network"));
    renderPanel();
    await userEvent.type(await screen.findByRole("textbox", { name: "Tulis pesan" }), "Halo{Enter}");
    expect(await screen.findByText("Server tidak dapat dihubungi. Coba lagi.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Tulis pesan" })).toHaveValue("Halo");
  });
  it("foto diunggah lewat alamat unggah chat lalu dikirim sebagai image_url", async () => {
    serveChats({ messages: [] });
    uploadPhoto.mockImplementation(async (_file: File, _purpose: string, request: (body: object) => unknown) => {
      await request({ purpose: "menu", content_type: "image/webp", size: 10 });
      return { data: { public_url: "https://cdn.example/orders/1/chat/a.webp" } };
    });
    requestChatUpload.mockResolvedValue({ data: { upload_url: "u", public_url: "p", expires_at: "e" } });
    sendChatMessage.mockResolvedValue({
      data: { ...message(6, "merchant", null), image_url: "https://cdn.example/orders/1/chat/a.webp" },
    });
    renderPanel();
    await screen.findByRole("textbox", { name: "Tulis pesan" });
    await userEvent.upload(screen.getByLabelText("Kirim foto"), new File(["x"], "a.png", { type: "image/png" }));
    expect(requestChatUpload).toHaveBeenCalledWith("KK-1", { content_type: "image/webp", size: 10 });
    expect(sendChatMessage).toHaveBeenCalledWith("KK-1", { image_url: "https://cdn.example/orders/1/chat/a.webp" });
    expect(await screen.findByRole("img", { name: "Foto dari penjual" })).toBeInTheDocument();
  });
});

describe("cek berkala dan tandai dibaca", () => {
  it("after_id memakai id terbesar dari GET, bukan dari pesan yang baru dikirim sendiri", async () => {
    // Tampilan [1,2]; pembeli sudah mengirim 3 (belum terambil); penjual kirim -> 4. Cek berikutnya harus after_id=2.
    serveChats(
      { messages: [message(1, "customer", "A"), message(2, "merchant", "B")] },
      { messages: [message(3, "customer", "C"), message(4, "merchant", "D")] },
    );
    sendChatMessage.mockResolvedValue({ data: message(4, "merchant", "D") });
    renderPanel();
    await userEvent.type(await screen.findByRole("textbox", { name: "Tulis pesan" }), "D{Enter}");
    await screen.findByText("D");
    await pollNow();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/pesanan/KK-1/chat?after_id=2", expect.anything());
    expect(await screen.findByText("C")).toBeInTheDocument();
    const bodies = screen.getAllByRole("listitem").map((item) => within(item).getByText(/^[A-D]$/).textContent);
    expect(bodies).toEqual(["A", "B", "C", "D"]);
  });
  it("tab tersembunyi: tidak ada permintaan; terlihat lagi -> langsung cek", async () => {
    serveChats({ messages: [] });
    renderPanel();
    await screen.findByRole("textbox", { name: "Tulis pesan" });
    const callsBefore = fetchMock.mock.calls.length;
    setHidden(true);
    await pollNow();
    expect(fetchMock.mock.calls.length).toBe(callsBefore);
    setHidden(false);
    await pollNow();
    expect(fetchMock.mock.calls.length).toBe(callsBefore + 1);
  });
  it("pesan pembeli belum dibaca -> tandai dibaca dengan id pesan pembeli terakhir yang tampil, lalu refresh", async () => {
    serveChats({ messages: [message(1, "customer", "A"), message(2, "merchant", "B")], chat: { unread_count: 1 } });
    renderPanel();
    await waitFor(() => expect(markChatRead).toHaveBeenCalledWith("KK-1", 1));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    await pollNow();
    expect(markChatRead).toHaveBeenCalledTimes(1);
  });
  it("tandai dibaca gagal -> dicoba lagi pada cek berkala berikutnya, sekali saja", async () => {
    serveChats({ messages: [message(1, "customer", "A")], chat: { unread_count: 1 } });
    markChatRead.mockResolvedValueOnce({ error: { code: "INTERNAL_ERROR", message: "x" } });
    renderPanel();
    await waitFor(() => expect(markChatRead).toHaveBeenCalledTimes(1));
    expect(refresh).not.toHaveBeenCalled();
    await pollNow();
    await waitFor(() => expect(markChatRead).toHaveBeenCalledTimes(2));
    expect(markChatRead).toHaveBeenLastCalledWith("KK-1", 1);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    await pollNow();
    expect(markChatRead).toHaveBeenCalledTimes(2);
  });
  it("tanpa pesan belum dibaca -> tidak menandai", async () => {
    serveChats({ messages: [message(1, "customer", "A")] });
    renderPanel();
    await screen.findByText("A");
    expect(markChatRead).not.toHaveBeenCalled();
  });
  it("chat selesai -> timer cek berkala dihapus sebelum panel ditutup", async () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    serveChats({ messages: [message(1, "customer", "A")], chat: { is_open: false, closed_reason: "finished" } });
    renderPanel();
    await screen.findByText("A");
    // Timer cek berkala = setInterval berjeda 5 detik (waitFor juga memakai setInterval, dengan jeda lain).
    const pollTimer = setIntervalSpy.mock.results[setIntervalSpy.mock.calls.findIndex(([, delay]) => delay === 5000)];
    await waitFor(() => expect(clearIntervalSpy).toHaveBeenCalledWith(pollTimer.value));
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
  it("cek berkala gagal -> pesan galat kecil, tanpa melempar", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 503 }));
    renderPanel();
    expect(await screen.findByText("Chat belum bisa dimuat. Mencoba lagi…")).toBeInTheDocument();
  });
});

describe("laporan", () => {
  it("Laporkan membuka dialog alasan, mengirim, lalu tombol menjadi Sudah dilaporkan", async () => {
    serveChats({ messages: [message(1, "customer", "A")] });
    reportChat.mockResolvedValue({ data: { id: 1 } });
    renderPanel();
    await userEvent.click(await screen.findByRole("button", { name: "Laporkan" }));
    await userEvent.type(screen.getByRole("textbox", { name: /Alasan/ }), "Pembeli berkata kasar");
    await userEvent.click(screen.getByRole("button", { name: "Kirim laporan" }));
    expect(reportChat).toHaveBeenCalledWith("KK-1", "Pembeli berkata kasar");
    expect(await screen.findByRole("button", { name: "Sudah dilaporkan" })).toBeDisabled();
  });
  it("reported_by_me dari server -> tombol Sudah dilaporkan", async () => {
    serveChats({ messages: [], chat: { reported_by_me: true } });
    renderPanel();
    expect(await screen.findByRole("button", { name: "Sudah dilaporkan" })).toBeDisabled();
  });
});

describe("tautan #chat", () => {
  const scrollIntoView = vi.fn();
  beforeEach(() => {
    scrollIntoView.mockReset();
    Element.prototype.scrollIntoView = scrollIntoView;
    serveChats({ messages: [] });
  });
  afterEach(() => {
    window.location.hash = "";
  });
  it("URL berakhiran #chat -> panel ber-id chat digulir ke layar", async () => {
    window.location.hash = "#chat";
    renderPanel();
    await screen.findByText("Belum ada pesan.");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById("chat"));
  });
  it("tanpa #chat -> tidak menggulir", async () => {
    renderPanel();
    await screen.findByText("Belum ada pesan.");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
