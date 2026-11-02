import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
const saveMenu = vi.fn();
const unggahFoto = vi.fn();
vi.mock("@/app/actions/menus", () => ({ saveMenu: (...a: unknown[]) => saveMenu(...a) }));
vi.mock("@/lib/unggah", () => ({ unggahFoto: (...a: unknown[]) => unggahFoto(...a) }));
import { Toaster } from "@/components/ui/Toast";
import { categories } from "@/lib/fixtures/meta";
import { menus } from "@/lib/fixtures/menus";
import { MenuForm } from "./MenuForm";

const cats = categories();
const tampil = (p: Partial<React.ComponentProps<typeof MenuForm>> = {}) =>
  render(<><a href="/dashboard">Beranda</a><Toaster /><MenuForm categories={cats} {...p} /></>);
const ketik = async (label: string | RegExp, teks: string) => {
  const el = screen.getByLabelText(label);
  await userEvent.clear(el);
  if (teks) await userEvent.type(el, teks);
};
const isiValid = async () => {
  await ketik(/Nama menu/, "Nasi Box");
  await userEvent.selectOptions(screen.getByLabelText(/Kategori/), String(cats[0].id));
  await ketik(/HPP/, "9000");
  await ketik(/Harga jual/, "15000");
};
const berkas = () => new File([new Uint8Array(10)], "f.png", { type: "image/png" });
const pilihFoto = () => fireEvent.change(document.querySelector("input[type=file]") as HTMLInputElement, { target: { files: [berkas()] } });

beforeEach(() => {
  push.mockReset(); saveMenu.mockReset(); unggahFoto.mockReset();
  unggahFoto.mockResolvedValue({ data: { upload_url: null, public_url: null } });
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});

describe("G-2 ringkasan error", () => {
  it("submit kosong -> ringkasan dengan beberapa error dan fokus pindah ke sana", async () => {
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    const r = screen.getByRole("alert", { name: "" });
    expect(r).toHaveFocus();
    expect(r).toHaveTextContent("Nama menu");
    expect(r).toHaveTextContent("Kategori");
    expect(r).toHaveTextContent("Harga jual");
    expect(saveMenu).not.toHaveBeenCalled();
  });
  it("validasi saat blur menampilkan error di bawah field", async () => {
    tampil();
    await userEvent.click(screen.getByLabelText(/Nama menu/));
    await userEvent.tab();
    expect(screen.getByText("Nama menu wajib diisi.")).toBeInTheDocument();
  });
});

describe("MF-E1 / MF-A3 harga & margin", () => {
  it("harga <= HPP menampilkan pesan HPP", async () => {
    tampil();
    await ketik(/HPP/, "12000");
    await ketik(/Harga jual/, "12000");
    await userEvent.tab();
    expect(screen.getByText("Harga jual harus lebih besar dari HPP (Rp 12.000).")).toBeInTheDocument();
  });
  it("margin < 10% -> peringatan, tombol simpan tetap bisa; laba per porsi tampil", async () => {
    tampil();
    await ketik(/HPP/, "9500");
    await ketik(/Harga jual/, "10000");
    expect(screen.getByRole("status")).toHaveTextContent(/Margin tipis/);
    expect(screen.getByText(/Laba per porsi/)).toHaveTextContent("Rp 500");
    expect(screen.getByRole("button", { name: "Simpan menu" })).toBeEnabled();
  });
  it("pratinjau tidak memuat HPP", async () => {
    tampil();
    await ketik(/HPP/, "7777");
    expect(screen.getByRole("region", { name: "Pratinjau untuk pembeli" })).not.toHaveTextContent("7.777");
  });
});

describe("pre-order & opsi", () => {
  it("sakelar menampilkan Pesan H-", async () => {
    tampil();
    expect(screen.queryByLabelText(/Pesan H-/)).toBeNull();
    await userEvent.click(screen.getByRole("switch", { name: "Menu pre-order" }));
    expect(screen.getByLabelText(/Pesan H-/)).toBeInTheDocument();
  });
  it("MF-E6 opsi sama -> error di baris; tambah, urutkan, hapus", async () => {
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Tambah opsi" }));
    await userEvent.click(screen.getByRole("button", { name: "Tambah opsi" }));
    await userEvent.type(screen.getByLabelText("Nama opsi 1"), "Pedas");
    await userEvent.type(screen.getByLabelText("Nama opsi 2"), "pedas");
    await userEvent.tab();
    expect(screen.getByText("Nama opsi sama dengan opsi lain.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Turunkan opsi 1" }));
    expect(screen.getByLabelText("Nama opsi 2")).toHaveValue("Pedas");
    await userEvent.click(screen.getByRole("button", { name: "Hapus opsi 2" }));
    expect(screen.queryByLabelText("Nama opsi 2")).toBeNull();
  });
});

describe("MF-N1 simpan", () => {
  it("sukses -> toast dan pindah ke /menu", async () => {
    saveMenu.mockResolvedValue({ data: menus()[0] });
    tampil();
    await isiValid();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(null, expect.objectContaining({ name: "Nasi Box", price: 15000, hpp: 9000, image_url: null }));
    expect((await screen.findAllByText("Menu disimpan")).length).toBeGreaterThan(0);
    expect(push).toHaveBeenCalledWith("/menu");
  });
  it("MF-E4 error validasi server dipetakan ke field + ringkasan", async () => {
    saveMenu.mockResolvedValue({ error: { code: "VALIDATION_ERROR", message: "x", fields: { name: ["Nama sudah dipakai."] } } });
    tampil();
    await isiValid();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(await screen.findAllByText(/Nama sudah dipakai\./)).toHaveLength(2);
    expect(push).not.toHaveBeenCalled();
  });
  it("klik kedua setelah sukses tidak menyimpan ulang", async () => {
    saveMenu.mockResolvedValue({ data: menus()[0] });
    tampil();
    await isiValid();
    const tombol = screen.getByRole("button", { name: "Simpan menu" });
    await userEvent.click(tombol);
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Menyimpan…" })).toBeDisabled();
    fireEvent.submit(tombol.closest("form")!);
    expect(saveMenu).toHaveBeenCalledTimes(1);
  });
  it("gagal tanpa fields -> toast, isian tetap", async () => {
    saveMenu.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Menu belum tersimpan. Coba lagi." } });
    tampil();
    await isiValid();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(await screen.findByText("Menu belum tersimpan. Coba lagi.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama menu/)).toHaveValue("Nasi Box");
  });
});

describe("MF-N2 ubah", () => {
  it("terisi dari menu, judul via halaman; simpan memakai id", async () => {
    saveMenu.mockResolvedValue({ data: menus()[0] });
    const m = menus()[0];
    tampil({ menu: m });
    expect(screen.getByLabelText(/Nama menu/)).toHaveValue(m.name);
    expect(screen.getByLabelText(/Harga jual/)).toHaveValue(m.price);
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(m.id, expect.anything());
  });
});

describe("HP-N2 prefill", () => {
  it("HPP dan harga terisi dari query", () => {
    tampil({ prefill: { hpp: 7000, price: 12000 } });
    expect(screen.getByLabelText(/HPP/)).toHaveValue(7000);
    expect(screen.getByLabelText(/Harga jual/)).toHaveValue(12000);
  });
});

describe("MF-E2/E3/A2 foto", () => {
  it("MF-E2 format salah ditolak sebelum unggah", () => {
    tampil();
    fireEvent.change(document.querySelector("input[type=file]") as HTMLInputElement, { target: { files: [new File(["x"], "a.gif", { type: "image/gif" })] } });
    expect(screen.getByText("Format foto harus JPG, PNG, atau WebP.")).toBeInTheDocument();
    expect(unggahFoto).not.toHaveBeenCalled();
  });
  it("MF-A2 progres selama unggah, tombol simpan menunggu", async () => {
    let selesai!: (v: unknown) => void;
    unggahFoto.mockReturnValue(new Promise((r) => { selesai = r; }));
    tampil();
    pilihFoto();
    expect(await screen.findByText("Mengunggah foto…")).toBeInTheDocument();
    expect(unggahFoto.mock.calls[0][1]).toBe("menu");
    expect(unggahFoto.mock.calls[0][0]).toBeInstanceOf(File);
    expect(screen.getByRole("button", { name: "Simpan menu" })).toBeDisabled();
    await act(async () => selesai({ data: { upload_url: null, public_url: null } }));
    expect(screen.getByRole("button", { name: "Simpan menu" })).toBeEnabled();
  });
  it("MF-E3 unggah gagal -> pesan + ulang; menu tetap bisa disimpan tanpa foto", async () => {
    unggahFoto.mockResolvedValueOnce({ error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } });
    saveMenu.mockResolvedValue({ data: menus()[0] });
    tampil();
    await isiValid();
    pilihFoto();
    expect(await screen.findByText("Foto gagal diunggah. Coba lagi")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(null, expect.objectContaining({ image_url: null }));
  });
  it("unggahan lama yang terlambat tidak menimpa foto yang dipilih kemudian", async () => {
    const tunda: ((v: unknown) => void)[] = [];
    unggahFoto.mockImplementation(() => new Promise((r) => tunda.push(r)));
    let n = 0;
    URL.createObjectURL = vi.fn(() => `blob:${++n}`);
    saveMenu.mockResolvedValue({ data: menus()[0] });
    tampil();
    await isiValid();
    pilihFoto();
    pilihFoto();
    await act(async () => tunda[1]({ data: { upload_url: null, public_url: "https://x/b.png" } }));
    await act(async () => tunda[0]({ data: { upload_url: null, public_url: "https://x/a.png" } }));
    expect(screen.getByAltText("Pratinjau foto menu")).toHaveAttribute("src", "blob:2");
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(null, expect.objectContaining({ image_url: "https://x/b.png" }));
  });
  it("Hapus foto saat unggah berjalan: respons terlambat tidak menghidupkan foto lagi", async () => {
    let selesai!: (v: unknown) => void;
    unggahFoto.mockReturnValue(new Promise((r) => { selesai = r; }));
    saveMenu.mockResolvedValue({ data: menus()[0] });
    tampil();
    await isiValid();
    pilihFoto();
    await userEvent.click(await screen.findByRole("button", { name: "Hapus foto" }));
    await act(async () => selesai({ data: { upload_url: null, public_url: "https://x/a.png" } }));
    expect(screen.queryByAltText("Pratinjau foto menu")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(null, expect.objectContaining({ image_url: null }));
  });
  it("mode ubah: unggahan foto baru gagal -> pratinjau kembali ke foto tersimpan", async () => {
    unggahFoto.mockResolvedValue({ error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } });
    tampil({ menu: { ...menus()[0], image_url: "https://x/lama.png" } });
    pilihFoto();
    await screen.findByText("Foto gagal diunggah. Coba lagi");
    expect(screen.getByAltText("Pratinjau foto menu")).toHaveAttribute("src", expect.stringContaining("lama.png"));
  });
  it("sukses -> simpan mengirim image_url = public_url", async () => {
    unggahFoto.mockResolvedValue({ data: { public_url: "https://r2.test/menu/a.png" } });
    saveMenu.mockResolvedValue({ data: menus()[0] });
    tampil();
    await isiValid();
    pilihFoto();
    await waitFor(() => expect(screen.getByRole("button", { name: "Simpan menu" })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(null, expect.objectContaining({ image_url: "https://r2.test/menu/a.png" }));
  });
  it("mode ubah: unggah gagal -> simpan tetap mengirim image_url lama", async () => {
    unggahFoto.mockResolvedValue({ error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } });
    saveMenu.mockResolvedValue({ data: menus()[0] });
    tampil({ menu: { ...menus()[0], image_url: "https://x/lama.png" } });
    pilihFoto();
    await screen.findByText("Foto gagal diunggah. Coba lagi");
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(menus()[0].id, expect.objectContaining({ image_url: "https://x/lama.png" }));
  });
  it("pesan galat dari server ditampilkan apa adanya (bukan pesan tetap)", async () => {
    unggahFoto.mockResolvedValue({ error: { code: "SERVICE_UNAVAILABLE", message: "Unggah foto belum tersedia. Coba lagi nanti." } });
    tampil();
    pilihFoto();
    expect(await screen.findByText("Unggah foto belum tersedia. Coba lagi nanti.")).toBeInTheDocument();
    expect(screen.queryByText("Foto gagal diunggah. Coba lagi")).toBeNull();
  });
  it("galat server fields.image_url: tampil di bagian foto, ringkasan menaut ke #mf-image_url", async () => {
    saveMenu.mockResolvedValue({ error: { code: "VALIDATION_ERROR", message: "x", fields: { image_url: ["Foto tidak valid. Unggah ulang foto."] } } });
    tampil();
    await isiValid();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    const ringkasan = await screen.findByRole("alert", { name: "" });
    expect(ringkasan).toHaveTextContent("Foto: Foto tidak valid. Unggah ulang foto.");
    expect(document.getElementById("mf-image_url")).not.toBeNull();
    expect(within(screen.getByRole("region", { name: "Foto" })).getByText("Foto tidak valid. Unggah ulang foto.")).toBeInTheDocument();
  });
  it("tombol ulang mencoba lagi", async () => {
    unggahFoto.mockResolvedValueOnce({ error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } });
    tampil();
    pilihFoto();
    await userEvent.click(await screen.findByRole("button", { name: "Coba unggah lagi" }));
    expect(unggahFoto).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Foto gagal diunggah. Coba lagi")).toBeNull();
  });
});

describe("MF-A1 / G-5 penjaga perubahan", () => {
  it("tidak dirty: klik tautan tidak memunculkan dialog; beforeunload tidak dicegah", async () => {
    tampil();
    const e = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.queryByText("Buang perubahan?")).toBeNull();
  });
  it("mode ubah: fokus lalu blur kolom opsi tanpa mengubah isi bukan perubahan", async () => {
    tampil({ menu: menus()[0] });
    await userEvent.click(screen.getByLabelText("Nama opsi 1"));
    await userEvent.tab();
    const e = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.queryByText("Buang perubahan?")).toBeNull();
  });
  it("dirty: beforeunload dicegah; klik tautan menampilkan dialog; Tetap di sini membatalkan; Buang menavigasi", async () => {
    tampil();
    await ketik(/Nama menu/, "Baru");
    const e = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);

    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.getByText("Buang perubahan?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tetap di sini" }));
    expect(push).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    await userEvent.click(screen.getByRole("button", { name: "Buang perubahan" }));
    expect(push).toHaveBeenCalledWith("/dashboard");
  });
  it("setelah simpan sukses tidak ada peringatan", async () => {
    saveMenu.mockResolvedValue({ data: menus()[0] });
    tampil();
    await isiValid();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/menu"));
    const e = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.queryByText("Buang perubahan?")).toBeNull();
  });
});
