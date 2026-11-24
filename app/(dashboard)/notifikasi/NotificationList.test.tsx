// Test NotificationList: judul, isi, penanda belum dibaca, tandai semua dibaca lalu refresh, keadaan kosong, dan
// notifikasi pesan pembeli yang bertaut ke chat pesanan.
// Router dan server action dipalsukan (vi.mock).
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const markAllNotificationsRead = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/notifications", () => ({ markAllNotificationsRead: () => markAllNotificationsRead() }));
import { NotificationList } from "./NotificationList";
import type { AppNotification } from "@/types/notification";

const makeNotification = (overrides: Partial<AppNotification>): AppNotification => ({
  id: 1,
  type: "moderation",
  title: "Foto menu dihapus admin",
  body: 'Satu foto "Nasi Ayam" dihapus karena: Foto buram.',
  data: { menu_id: 3 },
  read_at: null,
  created_at: "2026-11-23T03:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  refresh.mockReset();
  markAllNotificationsRead.mockReset();
  markAllNotificationsRead.mockResolvedValue({ data: { unread_count: 0 } });
});

describe("NotificationList", () => {
  it("menampilkan judul, isi, penanda belum dibaca; dibuka → tandai semua dibaca lalu refresh badge", async () => {
    await act(async () => {
      render(
        <NotificationList
          rows={[
            makeNotification({}),
            makeNotification({
              id: 2,
              type: "info",
              title: "Libur nasional",
              body: "Operasional libur 25 Des.",
              read_at: "2026-11-22T00:00:00.000Z",
            }),
          ]}
          total={2}
          page={1}
          unread={1}
        />,
      );
    });
    expect(screen.getByText("Foto menu dihapus admin")).toBeInTheDocument();
    expect(screen.getByText(/Foto buram/)).toBeInTheDocument();
    expect(screen.getAllByText(/Belum dibaca/)).toHaveLength(1);
    expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalled();
  });
  it("tanpa yang belum dibaca: tidak memanggil server; kosong → empty state", async () => {
    await act(async () => {
      render(<NotificationList rows={[]} total={0} page={1} unread={0} />);
    });
    expect(screen.getByText("Belum ada notifikasi")).toBeInTheDocument();
    expect(markAllNotificationsRead).not.toHaveBeenCalled();
  });
});

describe("notifikasi pesan pembeli", () => {
  const chatNotification = (data: AppNotification["data"]) =>
    makeNotification({
      id: 5,
      type: "chat_message",
      title: "Pesan baru dari pembeli",
      body: "Pembeli mengirim pesan di pesanan KK-20261125-AB12.",
      data,
      read_at: "2026-11-25T03:00:00.000Z",
    });
  it("chat_message -> judul bertaut ke /pesanan/<kode>#chat dengan ikon chat", async () => {
    await act(async () => {
      render(
        <NotificationList
          rows={[chatNotification({ order_code: "KK-20261125-AB12" })]}
          total={1}
          page={1}
          unread={0}
        />,
      );
    });
    const link = screen.getByRole("link", { name: "Pesan baru dari pembeli" });
    expect(link).toHaveAttribute("href", "/pesanan/KK-20261125-AB12#chat");
    expect(screen.getByRole("listitem").querySelector("svg.lucide-messages-square")).not.toBeNull();
    expect(screen.getByText("Pembeli mengirim pesan di pesanan KK-20261125-AB12.")).toBeInTheDocument();
  });
  it("data berupa teks JSON (bentuk dari production) -> tetap bertaut ke chat pesanannya", async () => {
    await act(async () => {
      render(
        <NotificationList
          rows={[chatNotification('{"order_code":"KK-20261125-AB12"}')]}
          total={1}
          page={1}
          unread={0}
        />,
      );
    });
    expect(screen.getByRole("link", { name: "Pesan baru dari pembeli" })).toHaveAttribute(
      "href",
      "/pesanan/KK-20261125-AB12#chat",
    );
  });
  it.each([
    ["teks rusak", "{bukan json"],
    ["teks tanpa kode", '{"menu_id":3}'],
    ["kode kosong", { order_code: "" }],
  ])("data %s -> tampil tanpa tautan", async (_, data) => {
    await act(async () => {
      render(<NotificationList rows={[chatNotification(data)]} total={1} page={1} unread={0} />);
    });
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Pesan baru dari pembeli")).toBeInTheDocument();
  });
  it("chat_message tanpa order_code dan jenis tak dikenal -> teks biasa tanpa tautan", async () => {
    await act(async () => {
      render(
        <NotificationList
          rows={[chatNotification(null), makeNotification({ id: 6, type: "jenis_baru", title: "Kabar lain" })]}
          total={2}
          page={1}
          unread={0}
        />,
      );
    });
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Pesan baru dari pembeli")).toBeInTheDocument();
    expect(screen.getByText("Kabar lain")).toBeInTheDocument();
  });
});
