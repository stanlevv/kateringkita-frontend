import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
const saveProfile = vi.fn();
vi.mock("@/app/actions/profile", () => ({ saveProfile: (...a: unknown[]) => saveProfile(...a) }));
import { Toaster } from "@/components/ui/Toast";
import { orders } from "@/lib/fixtures/orders";
import { TEMPLATE_BAWAAN } from "@/lib/wa-template";
import { TemplateEditor } from "./TemplateEditor";

const pesanan = orders()[0];
const tampil = (awal: string | null = "Halo {nama}, pesanan {kode}", order: typeof pesanan | null = pesanan) =>
  render(<><a href="/dashboard">Beranda</a><Toaster /><TemplateEditor namaToko="Dapur Diego" template={awal} order={order} /></>);
const editor = () => screen.getByLabelText(/Isi templat/) as HTMLTextAreaElement;
const simpan = () => screen.queryByRole("button", { name: "Simpan templat" });

beforeEach(() => { saveProfile.mockReset(); saveProfile.mockResolvedValue({ data: {} }); });

describe("WA-N1 chip placeholder", () => {
  it("menyisipkan di posisi kursor dan kursor tetap setelah sisipan", async () => {
    tampil("AB");
    const t = editor();
    t.focus();
    t.setSelectionRange(1, 1);
    await userEvent.click(screen.getByRole("button", { name: /\{kode\}/ }));
    expect(t.value).toBe("A{kode}B");
    expect(t.selectionStart).toBe(7);
    expect(t.selectionEnd).toBe(7);
    expect(t).toHaveFocus();
  });
  it("mengganti teks yang disorot", async () => {
    tampil("ABC");
    const t = editor();
    t.setSelectionRange(0, 2);
    await userEvent.click(screen.getByRole("button", { name: /\{nama\}/ }));
    expect(t.value).toBe("{nama}C");
  });
});

describe("WA-N2 pratinjau langsung", () => {
  it("terisi dengan pesanan contoh dan ikut berubah saat mengetik", async () => {
    tampil("Halo {nama}");
    const p = screen.getByRole("region", { name: "Pratinjau pesan" });
    expect(p).toHaveTextContent(`Halo ${pesanan.customer_name}`);
    await userEvent.type(editor(), " ya");
    expect(p).toHaveTextContent(`Halo ${pesanan.customer_name} ya`);
  });
  it("tanpa pesanan contoh: kata kunci apa adanya + catatan", () => {
    tampil("Halo {nama}", null);
    expect(screen.getByRole("region", { name: "Pratinjau pesan" })).toHaveTextContent("Halo {nama}");
    expect(screen.getByText(/setelah ada pesanan/)).toBeInTheDocument();
  });
  it("template kosong (null) memakai bawaan", () => {
    tampil(null);
    expect(editor().value).toBe(TEMPLATE_BAWAAN);
  });
});

describe("WA-E1/E2 galat", () => {
  it("kata kunci tak dikenal -> pesan dan simpan dicegah", async () => {
    tampil("Halo {harga}");
    await userEvent.type(editor(), " {{kode}");
    expect(screen.getAllByText("Kata kunci {harga} tidak dikenal.").length).toBeGreaterThan(0);
    await userEvent.click(simpan()!);
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it("kosong -> error", async () => {
    tampil("a");
    await userEvent.clear(editor());
    expect(screen.getByText("Templat tidak boleh kosong.")).toBeInTheDocument();
  });
  it("> 1.000 karakter -> error dengan penghitung", async () => {
    tampil("a".repeat(1001));
    expect(screen.getByText("Templat maksimal 1.000 karakter.")).toBeInTheDocument();
    expect(screen.getByText("1.001/1.000 karakter")).toBeInTheDocument();
  });
});

describe("WA-A1 kembalikan ke bawaan", () => {
  it("lewat dialog; setelahnya templat bawaan dan belum tersimpan", async () => {
    tampil("Halo {nama}");
    await userEvent.click(screen.getByRole("button", { name: "Kembalikan ke bawaan" }));
    expect(editor().value).toBe("Halo {nama}");
    await userEvent.click(screen.getByRole("button", { name: "Kembalikan" }));
    expect(editor().value).toBe(TEMPLATE_BAWAAN);
    expect(simpan()).toBeInTheDocument();
  });
  it("Batal tidak mengubah", async () => {
    tampil("Halo {nama}");
    await userEvent.click(screen.getByRole("button", { name: "Kembalikan ke bawaan" }));
    await userEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(editor().value).toBe("Halo {nama}");
  });
});

describe("WA-N3 simpan & G-5", () => {
  it("tombol simpan hanya saat berubah; simpan mengirim wa_template saja; toast", async () => {
    tampil("Halo");
    expect(simpan()).not.toBeInTheDocument();
    await userEvent.type(editor(), " {{kode}");
    await userEvent.click(simpan()!);
    expect(saveProfile).toHaveBeenCalledWith({ wa_template: "Halo {kode}" });
    expect(await screen.findByText("Templat disimpan")).toBeInTheDocument();
    expect(simpan()).not.toBeInTheDocument();
  });
  it("gagal simpan -> toast galat, tetap berubah", async () => {
    saveProfile.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Pengaturan belum tersimpan. Coba lagi." } });
    tampil("Halo");
    await userEvent.type(editor(), "!");
    await userEvent.click(simpan()!);
    expect(await screen.findByText("Pengaturan belum tersimpan. Coba lagi.")).toBeInTheDocument();
    expect(simpan()).toBeInTheDocument();
  });
  it("saat galat: tombol aria-disabled dengan alasan terlihat", async () => {
    tampil("Halo");
    await userEvent.type(editor(), " {{harga}");
    const b = simpan()!;
    expect(b).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Perbaiki isi templat dulu sebelum menyimpan.")).toBeInTheDocument();
    expect(b).toHaveAccessibleDescription("Perbaiki isi templat dulu sebelum menyimpan.");
  });
  it("peringatan keluar saat belum disimpan", async () => {
    tampil("Halo");
    await userEvent.type(editor(), "!");
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Buang perubahan?");
  });
});
