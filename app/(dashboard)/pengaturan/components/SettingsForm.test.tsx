import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh }) }));
const saveProfile = vi.fn();
const changePassword = vi.fn();
vi.mock("@/app/actions/profile", () => ({ saveProfile: (...a: unknown[]) => saveProfile(...a) }));
const unggahFoto = vi.fn();
vi.mock("@/lib/unggah", () => ({ unggahFoto: (...a: unknown[]) => unggahFoto(...a) }));
vi.mock("@/app/actions/account", () => ({ changePassword: (...a: unknown[]) => changePassword(...a) }));
import { Toaster } from "@/app/components/ui/Toast";
import { pickupPoints } from "@/lib/fixtures/meta";
import { profile } from "@/lib/fixtures/profile";
import { SettingsForm } from "./SettingsForm";

const user = { full_name: "Diego", phone: "081234567890", email: "d@x.id" };
const tampil = (p: Partial<React.ComponentProps<typeof SettingsForm>> = {}) =>
  render(<><a href="/dashboard">Beranda</a><Toaster /><SettingsForm profile={profile()} pickupPoints={pickupPoints()} user={user} {...p} /></>);
const ketik = async (label: string | RegExp, teks: string) => {
  const el = screen.getByLabelText(label);
  await userEvent.clear(el);
  if (teks) await userEvent.type(el, teks);
};
const bar = () => screen.queryByRole("button", { name: "Simpan perubahan" });

beforeEach(() => {
  unggahFoto.mockReset(); saveProfile.mockReset(); changePassword.mockReset(); refresh.mockReset();
  saveProfile.mockResolvedValue({ data: profile() });
  Element.prototype.scrollIntoView = vi.fn();
});

describe("PG-N1 bilah simpan menempel", () => {
  it("tidak ada tanpa perubahan; muncul saat berubah; Batalkan mengembalikan nilai", async () => {
    tampil();
    expect(bar()).not.toBeInTheDocument();
    await ketik(/Nama usaha/, "Dapur Lain");
    expect(bar()).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Batalkan perubahan" }));
    expect(bar()).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Nama usaha/)).toHaveValue(profile().business_name);
  });
  it("kembali ke nilai awal secara manual menyembunyikan bilah", async () => {
    tampil();
    await ketik(/Nama usaha/, "X");
    await ketik(/Nama usaha/, profile().business_name);
    expect(bar()).not.toBeInTheDocument();
  });
  it("simpan sukses: Menyimpan…, toast, nilai jadi acuan baru, bilah hilang", async () => {
    let selesai!: (v: unknown) => void;
    saveProfile.mockReturnValue(new Promise((r) => { selesai = r; }));
    tampil();
    await ketik(/Nama usaha/, "Dapur Lain");
    await userEvent.click(bar()!);
    expect(screen.getByRole("button", { name: "Menyimpan…" })).toBeDisabled();
    await act(async () => { selesai({ data: { ...profile(), business_name: "Dapur Lain" } }); });
    expect(await screen.findByText("Pengaturan disimpan")).toBeInTheDocument();
    expect(bar()).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Nama usaha/)).toHaveValue("Dapur Lain");
    expect(saveProfile.mock.calls[0][0]).toMatchObject({ business_name: "Dapur Lain", wa_number: "081234567890", hold_minutes: 5, pickup_point_ids: [1, 2, 3], service_mode: "both" });
  });
  it("simpan gagal: toast galat, data form tetap, bilah tetap", async () => {
    saveProfile.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Pengaturan belum tersimpan. Coba lagi." } });
    tampil();
    await ketik(/Nama usaha/, "Dapur Lain");
    await userEvent.click(bar()!);
    expect(await screen.findByText("Pengaturan belum tersimpan. Coba lagi.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama usaha/)).toHaveValue("Dapur Lain");
    expect(bar()).toBeEnabled();
  });
  it("simpan melempar (jaringan putus): toast, tombol simpan aktif lagi", async () => {
    saveProfile.mockRejectedValue(new Error("Failed to fetch"));
    tampil();
    await ketik(/Nama usaha/, "Dapur Lain");
    await userEvent.click(bar()!);
    expect(await screen.findByText("Server tidak dapat dihubungi. Coba lagi.")).toBeInTheDocument();
    expect(bar()).toBeEnabled();
  });
});

describe("PG-E1 validasi", () => {
  it("jam tutup <= jam buka -> error dan tidak terkirim", async () => {
    tampil();
    fireEvent.change(screen.getByLabelText(/Jam tutup/), { target: { value: "07:00" } });
    await userEvent.click(bar()!);
    expect(screen.getAllByText("Jam tutup harus setelah jam buka.").length).toBeGreaterThan(0);
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it.each(["0", "31"])("durasi %s -> error", async (n) => {
    tampil();
    await ketik(/Durasi tahan/, n);
    await userEvent.tab();
    expect(screen.getByText(/Durasi tahan pesanan (minimal 1|maksimal 30)/)).toBeInTheDocument();
  });
  it("tanpa titik temu -> error; ringkasan menerima fokus (G-2)", async () => {
    tampil();
    for (const c of screen.getAllByRole("checkbox")) await userEvent.click(c);
    await userEvent.click(bar()!);
    expect(screen.getAllByText("Pilih minimal satu titik temu.").length).toBeGreaterThan(0);
    expect(screen.getByRole("alert", { name: "" })).toHaveFocus();
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it("no WA salah format -> error saat blur", async () => {
    tampil();
    await ketik(/Nomor WA toko/, "6281");
    await userEvent.tab();
    expect(screen.getByText(/diawali 08/)).toBeInTheDocument();
  });
  it("galat field dari server tampil di ringkasan", async () => {
    saveProfile.mockResolvedValue({ error: { code: "VALIDATION_ERROR", message: "x", fields: { address: ["Alamat ditolak."] } } });
    tampil();
    await ketik(/Alamat/, "Jl. Baru");
    await userEvent.click(bar()!);
    expect((await screen.findAllByText(/Alamat ditolak\./)).length).toBeGreaterThan(0);
  });
  it("deskripsi memakai penghitung karakter", async () => {
    tampil();
    await ketik(/Deskripsi/, "abc");
    expect(screen.getByText("3/500 karakter")).toBeInTheDocument();
  });
});

describe("PG-E4 titik temu gagal dimuat", () => {
  it("pesan + Coba lagi di bagian itu saja; bagian lain tetap bisa dipakai", async () => {
    tampil({ pickupPoints: null });
    await userEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(refresh).toHaveBeenCalled();
    await ketik(/Nama usaha/, "Dapur Lain");
    expect(bar()).toBeInTheDocument();
  });
});

describe("PG-A2 lengkapi bagian", () => {
  it("?lengkapi=titik-temu menggulir, memfokuskan judul, dan menyorot", async () => {
    tampil({ lengkapi: "titik-temu" });
    const bagian = document.getElementById("titik-temu")!;
    await waitFor(() => expect(bagian.scrollIntoView).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: "Titik temu" })).toHaveFocus();
    expect(bagian.className).toMatch(/ring-2/);
  });
  it("sorotan hilang setelah 3 detik", async () => {
    vi.useFakeTimers();
    try {
      tampil({ lengkapi: "titik-temu" });
      expect(document.getElementById("titik-temu")!.className).toMatch(/ring-2/);
      await act(async () => { vi.advanceTimersByTime(3100); });
      expect(document.getElementById("titik-temu")!.className).not.toMatch(/ring-2/);
    } finally { vi.useRealTimers(); }
  });
  it("nilai tak dikenal diabaikan", () => {
    tampil({ lengkapi: "xyz" });
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("PG-A1 peringatan keluar", () => {
  it("perubahan belum disimpan + klik tautan internal -> dialog", async () => {
    tampil();
    await ketik(/Nama usaha/, "Dapur Lain");
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Buang perubahan?");
  });
  it("tanpa perubahan tidak ada dialog", async () => {
    tampil();
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Logo & QRIS (M-10, FE-08)", () => {
  const png = () => new File([new Uint8Array(10)], "f.png", { type: "image/png" });
  const pilih = (i: number) => fireEvent.change(document.querySelectorAll("input[type=file]")[i] as HTMLInputElement, { target: { files: [png()] } });
  const dgn = { logo_url: "https://cdn.test/logo.png", qris_image_url: "https://cdn.test/qris.png" };

  it("ada pemilih berkas untuk logo dan QRIS; gambar server tampil; teks 'setelah fitur unggah' hilang", () => {
    tampil({ profile: { ...profile(), ...dgn } });
    expect(document.querySelectorAll("input[type=file]")).toHaveLength(2);
    expect(screen.getByAltText("Logo toko")).toBeInTheDocument();
    expect(screen.getByAltText("QRIS")).toBeInTheDocument();
    expect(screen.queryByText(/setelah fitur unggah/)).not.toBeInTheDocument();
  });
  it("unggah logo -> memanggil unggahFoto(berkas, 'logo'); simpan mengirim logo_url baru", async () => {
    unggahFoto.mockResolvedValue({ data: { public_url: "https://cdn.test/baru.png" } });
    tampil({ profile: { ...profile(), ...dgn } });
    pilih(0);
    await waitFor(() => expect(bar()).toBeInTheDocument());
    expect(unggahFoto.mock.calls[0][1]).toBe("logo");
    await userEvent.click(bar()!);
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0][0]).toMatchObject({ logo_url: "https://cdn.test/baru.png", qris_image_url: dgn.qris_image_url });
  });
  it("Hapus gambar QRIS -> qris_image_url null", async () => {
    tampil({ profile: { ...profile(), ...dgn } });
    await userEvent.click(within(screen.getByRole("group", { name: "QRIS" })).getByRole("button", { name: "Hapus gambar" }));
    await userEvent.click(bar()!);
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0][0]).toMatchObject({ logo_url: dgn.logo_url, qris_image_url: null });
  });
  it("tanpa perubahan gambar: kedua field sama dengan profil", async () => {
    tampil({ profile: { ...profile(), ...dgn } });
    await ketik(/Nama usaha/, "Dapur Lain");
    await userEvent.click(bar()!);
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0][0]).toMatchObject(dgn);
  });
  it("unggah gagal -> pesan Indonesia, gambar lama tetap, tidak ada perubahan", async () => {
    unggahFoto.mockResolvedValue({ error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } });
    tampil({ profile: { ...profile(), ...dgn } });
    pilih(1);
    expect(await screen.findByText("Foto gagal diunggah. Coba lagi")).toBeInTheDocument();
    expect(bar()).not.toBeInTheDocument();
  });
  it("selama mengunggah: status tampil dan Simpan menunggu", async () => {
    let selesai!: (v: unknown) => void;
    unggahFoto.mockReturnValue(new Promise((r) => { selesai = r; }));
    tampil({ profile: { ...profile(), ...dgn } });
    await ketik(/Nama usaha/, "Dapur Lain");
    pilih(0);
    expect(await screen.findByText("Mengunggah…")).toBeInTheDocument();
    expect(bar()).toBeDisabled();
    await act(async () => selesai({ data: { public_url: "https://cdn.test/b.png" } }));
    expect(bar()).toBeEnabled();
  });
  it("Hapus gambar saat unggah berjalan: respons terlambat tidak menghidupkan gambar lagi", async () => {
    let selesai!: (v: unknown) => void;
    unggahFoto.mockReturnValue(new Promise((r) => { selesai = r; }));
    tampil({ profile: { ...profile(), ...dgn } });
    pilih(0);
    await screen.findByText("Mengunggah…");
    await userEvent.click(within(screen.getByRole("group", { name: "Logo toko" })).getByRole("button", { name: "Hapus gambar" }));
    expect(screen.queryByText("Mengunggah…")).toBeNull();
    await act(async () => selesai({ data: { public_url: "https://cdn.test/terlambat.png" } }));
    expect(screen.queryByAltText("Logo toko")).toBeNull();
    expect(screen.queryByText("Logo terunggah.")).toBeNull();
    await userEvent.click(bar()!);
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0][0]).toMatchObject({ logo_url: null });
  });
  it("Batalkan perubahan saat unggah berjalan: respons terlambat diabaikan, form tidak kotor lagi", async () => {
    let selesai!: (v: unknown) => void;
    unggahFoto.mockReturnValue(new Promise((r) => { selesai = r; }));
    tampil({ profile: { ...profile(), ...dgn } });
    await ketik(/Nama usaha/, "Dapur Lain");
    pilih(0);
    await screen.findByText("Mengunggah…");
    await userEvent.click(screen.getByRole("button", { name: "Batalkan perubahan" }));
    await act(async () => selesai({ data: { public_url: "https://cdn.test/terlambat.png" } }));
    expect(bar()).not.toBeInTheDocument();
    expect(screen.getByAltText("Logo toko")).toHaveAttribute("src", expect.stringContaining("logo.png"));
    expect(screen.queryByText("Logo terunggah.")).toBeNull();
  });
  it("memilih dua kali: hanya unggahan terakhir yang dipakai", async () => {
    const tunda: ((v: unknown) => void)[] = [];
    unggahFoto.mockImplementation(() => new Promise((r) => tunda.push(r)));
    tampil({ profile: { ...profile(), ...dgn } });
    pilih(0);
    pilih(0);
    await act(async () => tunda[1]({ data: { public_url: "https://cdn.test/kedua.png" } }));
    await act(async () => tunda[0]({ data: { public_url: "https://cdn.test/pertama.png" } }));
    expect(screen.getByAltText("Logo toko")).toHaveAttribute("src", expect.stringContaining("kedua.png"));
    await userEvent.click(bar()!);
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0][0]).toMatchObject({ logo_url: "https://cdn.test/kedua.png" });
  });
  it("sukses diumumkan lewat role=status", async () => {
    unggahFoto.mockResolvedValue({ data: { public_url: "https://cdn.test/baru.png" } });
    tampil();
    pilih(0);
    expect(await screen.findByText("Logo terunggah.")).toHaveAttribute("role", "status");
    pilih(1);
    expect(await screen.findByText("QRIS terunggah.")).toHaveAttribute("role", "status");
  });
  it("kontrol foto punya id untuk tautan ringkasan galat", () => {
    tampil();
    expect(document.getElementById("pg-logo_url")).not.toBeNull();
    expect(document.getElementById("pg-qris_image_url")).not.toBeNull();
  });
  it("galat server fields.logo_url tampil di bagian logo", async () => {
    saveProfile.mockResolvedValue({ error: { code: "VALIDATION_ERROR", message: "x", fields: { logo_url: ["Foto tidak valid. Unggah ulang foto."] } } });
    tampil({ profile: { ...profile(), ...dgn } });
    await userEvent.click(within(screen.getByRole("group", { name: "Logo toko" })).getByRole("button", { name: "Hapus gambar" }));
    await userEvent.click(bar()!);
    expect((await screen.findAllByText(/Foto tidak valid. Unggah ulang foto./)).length).toBeGreaterThan(0);
  });
});

describe("Setelah simpan", () => {
  it("form dibaca ulang dari respons server dan shell disegarkan", async () => {
    saveProfile.mockResolvedValue({ data: { ...profile(), business_name: "Dapur Rapi", description: null } });
    tampil();
    await ketik(/Nama usaha/, "  Dapur Rapi  ");
    await userEvent.click(bar()!);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByLabelText(/Nama usaha/)).toHaveValue("Dapur Rapi");
    expect(screen.getByLabelText(/Deskripsi/)).toHaveValue("");
    expect(bar()).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });
});

describe("Enter & fokus", () => {
  it("Enter tanpa perubahan tidak menyimpan", async () => {
    tampil();
    await userEvent.type(screen.getByLabelText(/Nama usaha/), "{Enter}");
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it("bagian punya scroll-margin agar judul tidak tertutup header", () => {
    tampil();
    expect(document.getElementById("titik-temu")!.className).toMatch(/scroll-mt-24/);
  });
});

describe("Akun", () => {
  it("sandi baru sama dengan lama / sandi lama > 72 karakter -> error", async () => {
    tampil();
    await ketik(/Kata sandi lama/, "sama12345");
    await ketik(/^Kata sandi baru/, "sama12345");
    await ketik(/Ulangi kata sandi baru/, "sama12345");
    await userEvent.click(screen.getByRole("button", { name: "Ganti kata sandi" }));
    expect(changePassword).not.toHaveBeenCalled();
    expect(screen.getAllByText("Kata sandi baru harus berbeda dari kata sandi lama.").length).toBeGreaterThan(0);
    await ketik(/Kata sandi lama/, "a1".repeat(37));
    expect(screen.getAllByText("Kata sandi maksimal 72 karakter.").length).toBeGreaterThan(0);
  });
  it("menampilkan data pemilik (baca saja)", () => {
    tampil();
    const akun = document.getElementById("akun")!;
    expect(akun).toHaveTextContent("Diego");
    expect(akun).toHaveTextContent("0812-3456-7890");
    expect(akun).toHaveTextContent("d@x.id");
  });
  it("PG-E2 kata sandi lama salah -> error di field, form tidak dikosongkan", async () => {
    changePassword.mockResolvedValue({ error: { code: "VALIDATION_ERROR", message: "x", fields: { current_password: ["Kata sandi lama salah."] } } });
    tampil();
    await ketik(/Kata sandi lama/, "salah1234");
    await ketik(/^Kata sandi baru/, "baru12345");
    await ketik(/Ulangi kata sandi baru/, "baru12345");
    await userEvent.click(screen.getByRole("button", { name: "Ganti kata sandi" }));
    expect((await screen.findAllByText(/Kata sandi lama salah\./)).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Kata sandi lama/)).toHaveValue("salah1234");
  });
  it("PG-N2 sukses -> toast persis dan form kosong; tidak ada panggilan simpan toko", async () => {
    changePassword.mockResolvedValue({ data: { ok: true } });
    tampil();
    await ketik(/Kata sandi lama/, "lama12345");
    await ketik(/^Kata sandi baru/, "baru12345");
    await ketik(/Ulangi kata sandi baru/, "baru12345");
    await userEvent.click(screen.getByRole("button", { name: "Ganti kata sandi" }));
    expect(await screen.findByText("Kata sandi diganti. Perangkat lain sudah dikeluarkan.")).toBeInTheDocument();
    expect(changePassword).toHaveBeenCalledWith({ current_password: "lama12345", new_password: "baru12345" });
    expect(screen.getByLabelText(/Kata sandi lama/)).toHaveValue("");
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it("sandi baru lemah / konfirmasi beda -> tidak terkirim", async () => {
    tampil();
    await ketik(/Kata sandi lama/, "lama12345");
    await ketik(/^Kata sandi baru/, "abc");
    await ketik(/Ulangi kata sandi baru/, "abd");
    await userEvent.click(screen.getByRole("button", { name: "Ganti kata sandi" }));
    expect(changePassword).not.toHaveBeenCalled();
    expect(screen.getByText("Konfirmasi kata sandi tidak sama.")).toBeInTheDocument();
  });
});
