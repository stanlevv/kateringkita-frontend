import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const tandaiSemuaDibaca = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/notifikasi", () => ({ tandaiSemuaDibaca: () => tandaiSemuaDibaca() }));
import { DaftarNotifikasi } from "./DaftarNotifikasi";
import type { AppNotification } from "@/types/notification";

const n = (o: Partial<AppNotification>): AppNotification => ({
  id: 1,
  type: "moderation",
  title: "Foto menu dihapus admin",
  body: 'Satu foto "Nasi Ayam" dihapus karena: Foto buram.',
  data: { menu_id: 3 },
  read_at: null,
  created_at: "2026-11-23T03:00:00.000Z",
  ...o,
});

beforeEach(() => {
  refresh.mockReset();
  tandaiSemuaDibaca.mockReset();
  tandaiSemuaDibaca.mockResolvedValue({ data: { unread_count: 0 } });
});

describe("DaftarNotifikasi", () => {
  it("menampilkan judul, isi, penanda belum dibaca; dibuka → tandai semua dibaca lalu refresh badge", async () => {
    await act(async () => {
      render(
        <DaftarNotifikasi
          rows={[
            n({}),
            n({
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
    expect(tandaiSemuaDibaca).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalled();
  });
  it("tanpa yang belum dibaca: tidak memanggil server; kosong → empty state", async () => {
    await act(async () => {
      render(<DaftarNotifikasi rows={[]} total={0} page={1} unread={0} />);
    });
    expect(screen.getByText("Belum ada notifikasi")).toBeInTheDocument();
    expect(tandaiSemuaDibaca).not.toHaveBeenCalled();
  });
});
