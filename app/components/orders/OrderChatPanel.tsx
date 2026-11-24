// Komponen OrderChatPanel: chat penjual dengan pembeli di halaman detail pesanan (daftar pesan, kotak ketik, foto,
// pesan cepat "Pesanan sudah siap", tanda "Dibaca", dan tombol Laporkan).
// Baca data: cek berkala ke route GET /api/pesanan/[code]/chat. Ubah data: server action di app/actions/order-chat.ts.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, dan timer.
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Flag, ImagePlus } from "lucide-react";
import { markChatRead, reportChat, requestChatUpload, sendChatMessage } from "@/app/actions/order-chat";
import { Button } from "@/app/components/ui/Button";
import { Dialog } from "@/app/components/ui/Dialog";
import { Field } from "@/app/components/ui/Field";
import { Input, Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { cx, focusRing } from "@/app/components/ui/cx";
import { callAction } from "@/lib/action";
import { mergeMessages } from "@/lib/chat-messages";
import { formatTime } from "@/lib/format";
import { uploadPhoto } from "@/lib/upload";
import type { ApiError } from "@/types/api";
import type { ChatMessage, ChatState } from "@/types/order-chat";

const POLL_INTERVAL_MS = 5000; // jeda cek pesan baru selama panel terbuka
const READY_QUICK_REPLY = "Pesanan sudah siap";
const LOAD_FAILED_MESSAGE = "Chat belum bisa dimuat. Mencoba lagi…";
const REPORT_REASON_MESSAGE = "Alasan 5–500 karakter.";

/** Teks pengganti kotak ketik saat chat tidak bisa dipakai, per alasan dari server. */
const CLOSED_MESSAGES: Record<NonNullable<ChatState["closed_reason"]>, string> = {
  not_started: "Chat terbuka setelah pesanan dikonfirmasi.",
  finished: "Chat sudah ditutup karena pesanan selesai atau dibatalkan.",
  unavailable: "Chat tidak tersedia untuk pesanan meja.",
};
/** Kode galat 409 dari backend yang berarti chat sudah tidak bisa dipakai, beserta alasannya. */
const CLOSED_REASON_BY_CODE: Record<string, NonNullable<ChatState["closed_reason"]>> = {
  CHAT_NOT_OPEN: "not_started",
  CHAT_CLOSED: "finished",
  CHAT_UNAVAILABLE: "unavailable",
};

/** Id terbesar pesan dari pihak tertentu, atau 0 bila belum ada. */
const lastIdFrom = (messages: ChatMessage[], role: ChatMessage["sender_role"]) =>
  messages.reduce((maxId, message) => (message.sender_role === role ? Math.max(maxId, message.id) : maxId), 0);

/**
 * Panel chat satu pesanan untuk penjual. Pesan baru dicek tiap 5 detik selama tab terlihat; pesan pembeli yang
 * sudah tampil ditandai dibaca. Bila chat belum dibuka, sudah ditutup, atau tidak tersedia, kotak ketik diganti
 * teks penutupan dan riwayat tetap bisa dibaca.
 * @param props.code kode pesanan
 * @returns elemen `div` berisi daftar pesan, kotak ketik atau teks penutupan, dan dialog laporan
 */
export function OrderChatPanel({ code }: { code: string }) {
  // 1. State: pesan yang tampil, keadaan chat dari server, galat cek berkala, kiriman, dan dialog laporan.
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chat, setChat] = useState<ChatState | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [reporting, setReporting] = useState(false);
  // `after_id` hanya dari hasil GET: pesan kiriman sendiri bisa ber-id lebih besar daripada pesan pembeli yang belum
  // terambil, jadi memakai id pesan terakhir di layar bisa melewatkan pesan itu selamanya.
  const lastFetchedId = useRef(0);
  const markedReadId = useRef(0);
  const listRef = useRef<HTMLOListElement>(null);

  // 2. Cek berkala: langsung saat tampil, lalu tiap 5 detik; dilewati saat tab tersembunyi dan langsung jalan lagi
  //    saat tab terlihat. Berhenti (timer dihapus) bila chat tidak tersedia atau sudah ditutup karena tidak akan ada
  //    pesan baru.
  useEffect(() => {
    let isStopped = false;
    let isPolling = false;
    async function poll() {
      // 1. Lewati bila sudah berhenti, tab tersembunyi, atau cek sebelumnya belum selesai.
      if (isStopped || isPolling || document.hidden) return;
      isPolling = true;
      const afterId = lastFetchedId.current;
      try {
        // 2. Ambil pesan setelah `afterId` (tanpa `after_id` = seluruh riwayat).
        const response = await fetch(
          `/api/pesanan/${encodeURIComponent(code)}/chat${afterId ? `?after_id=${afterId}` : ""}`,
          { cache: "no-store" },
        );
        if (response.redirected) {
          // Sesi habis (dialihkan ke login): muat ulang halaman agar setelah login kembali ke detail pesanan.
          isStopped = true;
          location.reload();
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        const { data } = (await response.json()) as { data: { messages: ChatMessage[]; chat: ChatState } };
        if (isStopped) return;
        // 3. Gabungkan tanpa duplikat, simpan keadaan chat, lalu majukan penanda (tidak pernah mundur).
        lastFetchedId.current = data.messages.reduce(
          (maxId, message) => Math.max(maxId, message.id),
          lastFetchedId.current,
        );
        setMessages((current) => mergeMessages(current, data.messages));
        setChat(data.chat);
        setLoadFailed(false);
        if (!data.chat.available || data.chat.closed_reason === "finished") {
          isStopped = true;
          clearInterval(intervalId);
        }
      } catch {
        if (!isStopped) setLoadFailed(true);
      } finally {
        isPolling = false;
      }
    }
    const onVisibilityChange = () => void poll();
    const intervalId = setInterval(() => void poll(), POLL_INTERVAL_MS);
    void poll();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      isStopped = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [code]);

  // 3. Tandai dibaca sampai pesan pembeli terakhir yang tampil, sekali per pesan baru. Setelah berhasil, halaman
  //    dimuat ulang (router.refresh) supaya badge chat di sidebar ikut berkurang. Efek ini jalan lagi setiap cek
  //    berkala (keadaan `chat` baru), jadi tandai dibaca yang gagal dicoba lagi; penjaga `markedReadId` mencegah
  //    panggilan ganda selama tandai dibaca sebelumnya belum selesai atau sudah berhasil.
  const lastCustomerId = lastIdFrom(messages, "customer");
  useEffect(() => {
    if (!chat?.unread_count || lastCustomerId <= markedReadId.current) return;
    markedReadId.current = lastCustomerId;
    void callAction(() => markChatRead(code, lastCustomerId)).then((result) => {
      if ("data" in result) router.refresh();
      else markedReadId.current = 0; // dicoba lagi pada cek berkala berikutnya
    });
  }, [chat, lastCustomerId, code, router]);

  // 4. Gulir ke pesan terbaru setiap jumlah pesan bertambah.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  /** Galat kirim/unggah: 409 chat tertutup membuat panel hanya-baca; semua galat tampil sebagai toast. */
  function showFailure(error: ApiError) {
    const closedReason = CLOSED_REASON_BY_CODE[error.code];
    if (closedReason) setChat((current) => current && { ...current, is_open: false, closed_reason: closedReason });
    toast({ tone: "danger", message: error.message });
  }

  /** Mengirim satu pesan; pesan yang berhasil langsung tampil. Mengembalikan true bila berhasil. */
  async function send(input: { body?: string; image_url?: string }) {
    setSending(true);
    const result = await callAction(() => sendChatMessage(code, input));
    setSending(false);
    if ("error" in result) {
      showFailure(result.error);
      return false;
    }
    setMessages((current) => mergeMessages(current, [result.data]));
    return true;
  }

  /** Kotak ketik dikirim (tombol Kirim atau Enter); teks dikosongkan hanya bila berhasil. */
  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    if (await send({ body })) setDraft("");
  }

  /** Foto diperkecil, diunggah ke alamat unggah chat pesanan ini, lalu dikirim sebagai pesan foto. */
  async function sendPhoto(file: File) {
    // 1. Kunci kiriman selama mengunggah. Aturan ukuran foto menu dipakai (sisi terpanjang 1600 px, latar putih).
    setSending(true);
    const upload = await uploadPhoto(file, "menu", ({ content_type, size }) =>
      requestChatUpload(code, { content_type, size }),
    );
    setSending(false);
    // 2. Gagal unggah -> galat; berhasil -> kirim alamat publik fotonya.
    if ("error" in upload) showFailure(upload.error);
    else await send({ image_url: upload.data.public_url });
  }

  /** Mengirim laporan beralasan 5–500 karakter. Laporan kedua ditolak server dengan ALREADY_REPORTED. */
  async function submitReport(event: FormEvent<HTMLFormElement>) {
    // 1. Cek panjang alasan di peramban dulu, sama dengan aturan server.
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5 || trimmedReason.length > 500) return setReasonError(REPORT_REASON_MESSAGE);
    // 2. Kirim. Berhasil atau sudah pernah melapor -> tombol menjadi "Sudah dilaporkan".
    setReporting(true);
    const result = await callAction(() => reportChat(code, trimmedReason));
    setReporting(false);
    if ("error" in result && result.error.code !== "ALREADY_REPORTED") return setReasonError(result.error.message);
    setChat((current) => current && { ...current, reported_by_me: true });
    setReportOpen(false);
    toast({
      tone: "success",
      message: "data" in result ? "Laporan terkirim. Admin akan meninjau chat ini." : result.error.message,
    });
  }

  const lastMerchantId = lastIdFrom(messages, "merchant");
  const isRead = (message: ChatMessage) =>
    message.id === lastMerchantId &&
    chat?.other_party_last_read_id != null &&
    chat.other_party_last_read_id >= message.id;

  return (
    <div className="flex flex-col gap-3">
      {chat?.available && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            disabled={chat.reported_by_me}
            onClick={() => {
              setReasonError(undefined);
              setReportOpen(true);
            }}
          >
            <Flag aria-hidden className="size-4" />
            {chat.reported_by_me ? "Sudah dilaporkan" : "Laporkan"}
          </Button>
        </div>
      )}

      {chat === null && !loadFailed && <p className="text-ink-muted">Memuat chat…</p>}
      {loadFailed && <p className="text-warning">{LOAD_FAILED_MESSAGE}</p>}
      {chat && messages.length === 0 && chat.available && <p className="text-ink-muted">Belum ada pesan.</p>}

      {messages.length > 0 && (
        <ol
          ref={listRef}
          aria-label="Pesan chat"
          aria-live="polite"
          className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-md border border-line p-3"
        >
          {messages.map((message) => {
            const isMine = message.sender_role === "merchant";
            return (
              <li
                key={message.id}
                className={cx(
                  "flex max-w-[80%] flex-col gap-1",
                  isMine ? "self-end items-end" : "self-start items-start",
                )}
              >
                <div
                  className={cx("flex flex-col gap-2 rounded-lg px-3 py-2", isMine ? "bg-primary-soft" : "bg-subtle")}
                >
                  {message.image_url && (
                    <a href={message.image_url} target="_blank" rel="noopener noreferrer" className={focusRing}>
                      <Image
                        src={message.image_url}
                        alt={isMine ? "Foto dari penjual" : "Foto dari pembeli"}
                        width={240}
                        height={240}
                        unoptimized
                        className="h-auto max-h-60 w-auto rounded-md"
                      />
                    </a>
                  )}
                  {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
                </div>
                <span className="flex gap-1 text-xs text-ink-muted">
                  <span className="font-mono">{formatTime(message.created_at)}</span>
                  {isRead(message) && (
                    <>
                      <span aria-hidden>·</span>
                      <span>Dibaca</span>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {chat && !chat.is_open && chat.closed_reason && (
        <p className="rounded-md bg-subtle px-3 py-2 text-ink-muted">{CLOSED_MESSAGES[chat.closed_reason]}</p>
      )}
      {chat?.is_open && (
        <div className="flex flex-col gap-2">
          <div>
            <Button variant="secondary" disabled={sending} onClick={() => void send({ body: READY_QUICK_REPLY })}>
              {READY_QUICK_REPLY}
            </Button>
          </div>
          <form onSubmit={submitDraft} className="flex items-center gap-2">
            <label
              className={cx(
                "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-ink hover:bg-subtle focus-within:ring-2 focus-within:ring-focus",
                sending && "pointer-events-none opacity-50",
              )}
              title="Kirim foto"
            >
              <ImagePlus aria-hidden className="size-5" />
              <span className="sr-only">Kirim foto</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={sending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = ""; // supaya foto yang sama bisa dipilih lagi
                  if (file) void sendPhoto(file);
                }}
              />
            </label>
            <Input
              aria-label="Tulis pesan"
              placeholder="Tulis pesan"
              maxLength={1000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="flex-1"
            />
            <Button type="submit" loading={sending} disabled={!draft.trim()}>
              Kirim
            </Button>
          </form>
        </div>
      )}

      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} title="Laporkan chat">
        <form onSubmit={submitReport} className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            Admin akan membaca seluruh chat pesanan ini untuk meninjau laporanmu.
          </p>
          <Field label="Alasan laporan" help="5–500 karakter." error={reasonError} required>
            <Textarea value={reason} maxLength={500} rows={3} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReportOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={reporting}>
              Kirim laporan
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
