// Test TemplateEditor: sisip kata kunci di posisi kursor, pratinjau langsung, galat templat, kembalikan ke bawaan,
// simpan, dan penjaga perubahan. Router dan saveProfile dipalsukan (vi.mock).
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
const saveProfile = vi.fn();
vi.mock("@/app/actions/profile", () => ({ saveProfile: (...args: unknown[]) => saveProfile(...args) }));
import { Toaster } from "@/app/components/ui/Toast";
import { orders } from "@/lib/fixtures/orders";
import { TEMPLATE_BAWAAN } from "@/lib/wa-template";
import { TemplateEditor } from "./TemplateEditor";

const sampleOrder = orders()[0];
const renderEditor = (
  template: string | null = "Halo {nama}, pesanan {kode}",
  order: typeof sampleOrder | null = sampleOrder,
) =>
  render(
    <>
      <a href="/dashboard">Beranda</a>
      <Toaster />
      <TemplateEditor storeName="Dapur Diego" template={template} order={order} />
    </>,
  );
const editor = () => screen.getByLabelText(/Isi templat/) as HTMLTextAreaElement;
const saveButton = () => screen.queryByRole("button", { name: "Simpan templat" });

beforeEach(() => {
  saveProfile.mockReset();
  saveProfile.mockResolvedValue({ data: {} });
});

describe("WA-N1 chip placeholder", () => {
  it("menyisipkan di posisi kursor dan kursor tetap setelah sisipan", async () => {
    renderEditor("AB");
    const textarea = editor();
    textarea.focus();
    textarea.setSelectionRange(1, 1);
    await userEvent.click(screen.getByRole("button", { name: /\{kode\}/ }));
    expect(textarea.value).toBe("A{kode}B");
    expect(textarea.selectionStart).toBe(7);
    expect(textarea.selectionEnd).toBe(7);
    expect(textarea).toHaveFocus();
  });
  it("mengganti teks yang disorot", async () => {
    renderEditor("ABC");
    const textarea = editor();
    textarea.setSelectionRange(0, 2);
    await userEvent.click(screen.getByRole("button", { name: /\{nama\}/ }));
    expect(textarea.value).toBe("{nama}C");
  });
});

describe("WA-N2 pratinjau langsung", () => {
  it("terisi dengan pesanan contoh dan ikut berubah saat mengetik", async () => {
    renderEditor("Halo {nama}");
    const preview = screen.getByRole("region", { name: "Pratinjau pesan" });
    expect(preview).toHaveTextContent(`Halo ${sampleOrder.customer_name}`);
    await userEvent.type(editor(), " ya");
    expect(preview).toHaveTextContent(`Halo ${sampleOrder.customer_name} ya`);
  });
  it("tanpa pesanan contoh: kata kunci apa adanya + catatan", () => {
    renderEditor("Halo {nama}", null);
    expect(screen.getByRole("region", { name: "Pratinjau pesan" })).toHaveTextContent("Halo {nama}");
    expect(screen.getByText(/setelah ada pesanan/)).toBeInTheDocument();
  });
  it("template kosong (null) memakai bawaan", () => {
    renderEditor(null);
    expect(editor().value).toBe(TEMPLATE_BAWAAN);
  });
});

describe("WA-E1/E2 galat", () => {
  it("kata kunci tak dikenal -> pesan dan simpan dicegah", async () => {
    renderEditor("Halo {harga}");
    await userEvent.type(editor(), " {{kode}");
    expect(screen.getAllByText("Kata kunci {harga} tidak dikenal.").length).toBeGreaterThan(0);
    await userEvent.click(saveButton()!);
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it("kosong -> error", async () => {
    renderEditor("a");
    await userEvent.clear(editor());
    expect(screen.getByText("Templat tidak boleh kosong.")).toBeInTheDocument();
  });
  it("> 1.000 karakter -> error dengan penghitung", async () => {
    renderEditor("a".repeat(1001));
    expect(screen.getByText("Templat maksimal 1.000 karakter.")).toBeInTheDocument();
    expect(screen.getByText("1.001/1.000 karakter")).toBeInTheDocument();
  });
});

describe("WA-A1 kembalikan ke bawaan", () => {
  it("lewat dialog; setelahnya templat bawaan dan belum tersimpan", async () => {
    renderEditor("Halo {nama}");
    await userEvent.click(screen.getByRole("button", { name: "Kembalikan ke bawaan" }));
    expect(editor().value).toBe("Halo {nama}");
    await userEvent.click(screen.getByRole("button", { name: "Kembalikan" }));
    expect(editor().value).toBe(TEMPLATE_BAWAAN);
    expect(saveButton()).toBeInTheDocument();
  });
  it("Batal tidak mengubah", async () => {
    renderEditor("Halo {nama}");
    await userEvent.click(screen.getByRole("button", { name: "Kembalikan ke bawaan" }));
    await userEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(editor().value).toBe("Halo {nama}");
  });
});

describe("WA-N3 simpan & G-5", () => {
  it("tombol simpan hanya saat berubah; simpan mengirim wa_template saja; toast", async () => {
    renderEditor("Halo");
    expect(saveButton()).not.toBeInTheDocument();
    await userEvent.type(editor(), " {{kode}");
    await userEvent.click(saveButton()!);
    expect(saveProfile).toHaveBeenCalledWith({ wa_template: "Halo {kode}" });
    expect(await screen.findByText("Templat disimpan")).toBeInTheDocument();
    expect(saveButton()).not.toBeInTheDocument();
  });
  it("gagal simpan -> toast galat, tetap berubah", async () => {
    saveProfile.mockResolvedValue({
      error: { code: "INTERNAL_ERROR", message: "Pengaturan belum tersimpan. Coba lagi." },
    });
    renderEditor("Halo");
    await userEvent.type(editor(), "!");
    await userEvent.click(saveButton()!);
    expect(await screen.findByText("Pengaturan belum tersimpan. Coba lagi.")).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
  });
  it("saat galat: tombol aria-disabled dengan alasan terlihat", async () => {
    renderEditor("Halo");
    await userEvent.type(editor(), " {{harga}");
    const button = saveButton()!;
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Perbaiki isi templat dulu sebelum menyimpan.")).toBeInTheDocument();
    expect(button).toHaveAccessibleDescription("Perbaiki isi templat dulu sebelum menyimpan.");
  });
  it("peringatan keluar saat belum disimpan", async () => {
    renderEditor("Halo");
    await userEvent.type(editor(), "!");
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Buang perubahan?");
  });
});
