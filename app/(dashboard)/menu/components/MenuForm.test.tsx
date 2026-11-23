import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
const saveMenu = vi.fn();
const uploadPhoto = vi.fn();
vi.mock("@/app/actions/menus", () => ({ saveMenu: (...args: unknown[]) => saveMenu(...args) }));
vi.mock("@/lib/upload", () => ({ uploadPhoto: (...args: unknown[]) => uploadPhoto(...args) }));
import { Toaster } from "@/app/components/ui/Toast";
import { categories } from "@/lib/fixtures/meta";
import { menus } from "@/lib/fixtures/menus";
import { MenuForm } from "./MenuForm";

const allCategories = categories();
const renderForm = (props: Partial<React.ComponentProps<typeof MenuForm>> = {}) =>
  render(
    <>
      <a href="/dashboard">Beranda</a>
      <Toaster />
      <MenuForm categories={allCategories} {...props} />
    </>,
  );
const typeInto = async (label: string | RegExp, text: string) => {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  if (text) await userEvent.type(field, text);
};
const fillValid = async () => {
  await typeInto(/Nama menu/, "Nasi Box");
  await userEvent.selectOptions(screen.getByLabelText(/Kategori/), String(allCategories[0].id));
  await typeInto(/HPP/, "9000");
  await typeInto(/Harga jual/, "15000");
};
const createFile = () => new File([new Uint8Array(10)], "f.png", { type: "image/png" });
const choosePhoto = () =>
  fireEvent.change(document.querySelector("input[type=file]") as HTMLInputElement, {
    target: { files: [createFile()] },
  });

beforeEach(() => {
  push.mockReset();
  saveMenu.mockReset();
  uploadPhoto.mockReset();
  uploadPhoto.mockResolvedValue({ data: { upload_url: null, public_url: null } });
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});

describe("G-2 ringkasan error", () => {
  it("submit kosong -> ringkasan dengan beberapa error dan fokus pindah ke sana", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    const summary = screen.getByRole("alert", { name: "" });
    expect(summary).toHaveFocus();
    expect(summary).toHaveTextContent("Nama menu");
    expect(summary).toHaveTextContent("Kategori");
    expect(summary).toHaveTextContent("Harga jual");
    expect(saveMenu).not.toHaveBeenCalled();
  });
  it("validasi saat blur menampilkan error di bawah field", async () => {
    renderForm();
    await userEvent.click(screen.getByLabelText(/Nama menu/));
    await userEvent.tab();
    expect(screen.getByText("Nama menu wajib diisi.")).toBeInTheDocument();
  });
});

describe("MF-E1 / MF-A3 harga & margin", () => {
  it("harga <= HPP menampilkan pesan HPP", async () => {
    renderForm();
    await typeInto(/HPP/, "12000");
    await typeInto(/Harga jual/, "12000");
    await userEvent.tab();
    expect(screen.getByText("Harga jual harus lebih besar dari HPP (Rp 12.000).")).toBeInTheDocument();
  });
  it("margin < 10% -> peringatan, tombol simpan tetap bisa; laba per porsi tampil", async () => {
    renderForm();
    await typeInto(/HPP/, "9500");
    await typeInto(/Harga jual/, "10000");
    expect(screen.getByRole("status")).toHaveTextContent(/Margin tipis/);
    expect(screen.getByText(/Laba per porsi/)).toHaveTextContent("Rp 500");
    expect(screen.getByRole("button", { name: "Simpan menu" })).toBeEnabled();
  });
  it("pratinjau tidak memuat HPP", async () => {
    renderForm();
    await typeInto(/HPP/, "7777");
    expect(screen.getByRole("region", { name: "Pratinjau untuk pembeli" })).not.toHaveTextContent("7.777");
  });
});

describe("pre-order & opsi", () => {
  it("sakelar menampilkan Pesan H-", async () => {
    renderForm();
    expect(screen.queryByLabelText(/Pesan H-/)).toBeNull();
    await userEvent.click(screen.getByRole("switch", { name: "Menu pre-order" }));
    expect(screen.getByLabelText(/Pesan H-/)).toBeInTheDocument();
  });
  it("MF-E6 opsi sama -> error di baris; tambah, urutkan, hapus", async () => {
    renderForm();
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
    renderForm();
    await fillValid();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ name: "Nasi Box", price: 15000, hpp: 9000, image_url: null }),
    );
    expect((await screen.findAllByText("Menu disimpan")).length).toBeGreaterThan(0);
    expect(push).toHaveBeenCalledWith("/menu");
  });
  it("MF-E4 error validasi server dipetakan ke field + ringkasan", async () => {
    saveMenu.mockResolvedValue({
      error: { code: "VALIDATION_ERROR", message: "x", fields: { name: ["Nama sudah dipakai."] } },
    });
    renderForm();
    await fillValid();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(await screen.findAllByText(/Nama sudah dipakai\./)).toHaveLength(2);
    expect(push).not.toHaveBeenCalled();
  });
  it("klik kedua setelah sukses tidak menyimpan ulang", async () => {
    saveMenu.mockResolvedValue({ data: menus()[0] });
    renderForm();
    await fillValid();
    const saveButton = screen.getByRole("button", { name: "Simpan menu" });
    await userEvent.click(saveButton);
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Menyimpan…" })).toBeDisabled();
    fireEvent.submit(saveButton.closest("form")!);
    expect(saveMenu).toHaveBeenCalledTimes(1);
  });
  it("gagal tanpa fields -> toast, isian tetap", async () => {
    saveMenu.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Menu belum tersimpan. Coba lagi." } });
    renderForm();
    await fillValid();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(await screen.findByText("Menu belum tersimpan. Coba lagi.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama menu/)).toHaveValue("Nasi Box");
  });
});

describe("MF-N2 ubah", () => {
  it("terisi dari menu, judul via halaman; simpan memakai id", async () => {
    saveMenu.mockResolvedValue({ data: menus()[0] });
    const menu = menus()[0];
    renderForm({ menu });
    expect(screen.getByLabelText(/Nama menu/)).toHaveValue(menu.name);
    expect(screen.getByLabelText(/Harga jual/)).toHaveValue(menu.price);
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(menu.id, expect.anything());
  });
});

describe("HP-N2 prefill", () => {
  it("HPP dan harga terisi dari query", () => {
    renderForm({ prefill: { hpp: 7000, price: 12000 } });
    expect(screen.getByLabelText(/HPP/)).toHaveValue(7000);
    expect(screen.getByLabelText(/Harga jual/)).toHaveValue(12000);
  });
});

describe("MF-E2/E3/A2 foto", () => {
  it("MF-E2 format salah ditolak sebelum unggah", () => {
    renderForm();
    fireEvent.change(document.querySelector("input[type=file]") as HTMLInputElement, {
      target: { files: [new File(["x"], "a.gif", { type: "image/gif" })] },
    });
    expect(screen.getByText("Format foto harus JPG, PNG, atau WebP.")).toBeInTheDocument();
    expect(uploadPhoto).not.toHaveBeenCalled();
  });
  it("MF-A2 progres selama unggah, tombol simpan menunggu", async () => {
    let resolveUpload!: (value: unknown) => void;
    uploadPhoto.mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve;
      }),
    );
    renderForm();
    choosePhoto();
    expect(await screen.findByText("Mengunggah foto…")).toBeInTheDocument();
    expect(uploadPhoto.mock.calls[0][1]).toBe("menu");
    expect(uploadPhoto.mock.calls[0][0]).toBeInstanceOf(File);
    expect(screen.getByRole("button", { name: "Simpan menu" })).toBeDisabled();
    await act(async () => resolveUpload({ data: { upload_url: null, public_url: null } }));
    expect(screen.getByRole("button", { name: "Simpan menu" })).toBeEnabled();
  });
  it("MF-E3 unggah gagal -> pesan + ulang; menu tetap bisa disimpan tanpa foto", async () => {
    uploadPhoto.mockResolvedValueOnce({ error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } });
    saveMenu.mockResolvedValue({ data: menus()[0] });
    renderForm();
    await fillValid();
    choosePhoto();
    expect(await screen.findByText("Foto gagal diunggah. Coba lagi")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(null, expect.objectContaining({ image_url: null }));
  });
  it("unggahan lama yang terlambat tidak menimpa foto yang dipilih kemudian", async () => {
    const pendingResolvers: ((value: unknown) => void)[] = [];
    uploadPhoto.mockImplementation(() => new Promise((resolve) => pendingResolvers.push(resolve)));
    let counter = 0;
    URL.createObjectURL = vi.fn(() => `blob:${++counter}`);
    saveMenu.mockResolvedValue({ data: menus()[0] });
    renderForm();
    await fillValid();
    choosePhoto();
    choosePhoto();
    await act(async () => pendingResolvers[1]({ data: { upload_url: null, public_url: "https://x/b.png" } }));
    await act(async () => pendingResolvers[0]({ data: { upload_url: null, public_url: "https://x/a.png" } }));
    expect(screen.getByAltText("Pratinjau foto menu")).toHaveAttribute("src", "blob:2");
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(null, expect.objectContaining({ image_url: "https://x/b.png" }));
  });
  it("Hapus foto saat unggah berjalan: respons terlambat tidak menghidupkan foto lagi", async () => {
    let resolveUpload!: (value: unknown) => void;
    uploadPhoto.mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve;
      }),
    );
    saveMenu.mockResolvedValue({ data: menus()[0] });
    renderForm();
    await fillValid();
    choosePhoto();
    await userEvent.click(await screen.findByRole("button", { name: "Hapus foto" }));
    await act(async () => resolveUpload({ data: { upload_url: null, public_url: "https://x/a.png" } }));
    expect(screen.queryByAltText("Pratinjau foto menu")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(null, expect.objectContaining({ image_url: null }));
  });
  it("mode ubah: unggahan foto baru gagal -> pratinjau kembali ke foto tersimpan", async () => {
    uploadPhoto.mockResolvedValue({ error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } });
    renderForm({ menu: { ...menus()[0], image_url: "https://x/lama.png" } });
    choosePhoto();
    await screen.findByText("Foto gagal diunggah. Coba lagi");
    expect(screen.getByAltText("Pratinjau foto menu")).toHaveAttribute("src", expect.stringContaining("lama.png"));
  });
  it("sukses -> simpan mengirim image_url = public_url", async () => {
    uploadPhoto.mockResolvedValue({ data: { public_url: "https://r2.test/menu/a.png" } });
    saveMenu.mockResolvedValue({ data: menus()[0] });
    renderForm();
    await fillValid();
    choosePhoto();
    await waitFor(() => expect(screen.getByRole("button", { name: "Simpan menu" })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(null, expect.objectContaining({ image_url: "https://r2.test/menu/a.png" }));
  });
  it("mode ubah: unggah gagal -> simpan tetap mengirim image_url lama", async () => {
    uploadPhoto.mockResolvedValue({ error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } });
    saveMenu.mockResolvedValue({ data: menus()[0] });
    renderForm({ menu: { ...menus()[0], image_url: "https://x/lama.png" } });
    choosePhoto();
    await screen.findByText("Foto gagal diunggah. Coba lagi");
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    expect(saveMenu).toHaveBeenCalledWith(menus()[0].id, expect.objectContaining({ image_url: "https://x/lama.png" }));
  });
  it("pesan galat dari server ditampilkan apa adanya (bukan pesan tetap)", async () => {
    uploadPhoto.mockResolvedValue({
      error: { code: "SERVICE_UNAVAILABLE", message: "Unggah foto belum tersedia. Coba lagi nanti." },
    });
    renderForm();
    choosePhoto();
    expect(await screen.findByText("Unggah foto belum tersedia. Coba lagi nanti.")).toBeInTheDocument();
    expect(screen.queryByText("Foto gagal diunggah. Coba lagi")).toBeNull();
  });
  it("galat server fields.image_url: tampil di bagian foto, ringkasan menaut ke #mf-image_url", async () => {
    saveMenu.mockResolvedValue({
      error: {
        code: "VALIDATION_ERROR",
        message: "x",
        fields: { image_url: ["Foto tidak valid. Unggah ulang foto."] },
      },
    });
    renderForm();
    await fillValid();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    const summary = await screen.findByRole("alert", { name: "" });
    expect(summary).toHaveTextContent("Foto: Foto tidak valid. Unggah ulang foto.");
    expect(document.getElementById("mf-image_url")).not.toBeNull();
    expect(
      within(screen.getByRole("region", { name: "Foto" })).getByText("Foto tidak valid. Unggah ulang foto."),
    ).toBeInTheDocument();
  });
  it("tombol ulang mencoba lagi", async () => {
    uploadPhoto.mockResolvedValueOnce({ error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } });
    renderForm();
    choosePhoto();
    await userEvent.click(await screen.findByRole("button", { name: "Coba unggah lagi" }));
    expect(uploadPhoto).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Foto gagal diunggah. Coba lagi")).toBeNull();
  });
});

describe("MF-A1 / G-5 penjaga perubahan", () => {
  it("tidak dirty: klik tautan tidak memunculkan dialog; beforeunload tidak dicegah", async () => {
    renderForm();
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.queryByText("Buang perubahan?")).toBeNull();
  });
  it("mode ubah: fokus lalu blur kolom opsi tanpa mengubah isi bukan perubahan", async () => {
    renderForm({ menu: menus()[0] });
    await userEvent.click(screen.getByLabelText("Nama opsi 1"));
    await userEvent.tab();
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.queryByText("Buang perubahan?")).toBeNull();
  });
  it("dirty: beforeunload dicegah; klik tautan menampilkan dialog; Tetap di sini membatalkan; Buang menavigasi", async () => {
    renderForm();
    await typeInto(/Nama menu/, "Baru");
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

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
    renderForm();
    await fillValid();
    await userEvent.click(screen.getByRole("button", { name: "Simpan menu" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/menu"));
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.queryByText("Buang perubahan?")).toBeNull();
  });
});
