// Test SettingsForm: bilah simpan menempel, validasi, ?lengkapi= (gulir, fokus, sorot), penjaga perubahan, unggah
// logo dan background (termasuk respons terlambat), akun, dan rekening pencairan. Router, server action, dan
// uploadPhoto dipalsukan (vi.mock).
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh }) }));
const saveProfile = vi.fn();
const changePassword = vi.fn();
vi.mock("@/app/actions/profile", () => ({ saveProfile: (...args: unknown[]) => saveProfile(...args) }));
const uploadPhoto = vi.fn();
vi.mock("@/lib/upload", () => ({ uploadPhoto: (...args: unknown[]) => uploadPhoto(...args) }));
vi.mock("@/app/actions/account", () => ({ changePassword: (...args: unknown[]) => changePassword(...args) }));
const saveBankAccount = vi.fn();
vi.mock("@/app/actions/payouts", () => ({ saveBankAccount: (...args: unknown[]) => saveBankAccount(...args) }));
import { Toaster } from "@/app/components/ui/Toast";
import { pickupPoints } from "@/lib/fixtures/meta";
import { myPayouts } from "@/lib/fixtures/payouts";
import { profile } from "@/lib/fixtures/profile";
import { SettingsForm } from "./SettingsForm";

const user = { full_name: "Diego", phone: "081234567890", email: "d@x.id" };
const renderForm = (props: Partial<React.ComponentProps<typeof SettingsForm>> = {}) =>
  render(
    <>
      <a href="/dashboard">Beranda</a>
      <Toaster />
      <SettingsForm profile={profile()} pickupPoints={pickupPoints()} user={user} payouts={myPayouts()} {...props} />
    </>,
  );
const typeInto = async (label: string | RegExp, text: string) => {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  if (text) await userEvent.type(field, text);
};
const saveBar = () => screen.queryByRole("button", { name: "Simpan perubahan" });

beforeEach(() => {
  uploadPhoto.mockReset();
  saveProfile.mockReset();
  changePassword.mockReset();
  refresh.mockReset();
  saveBankAccount.mockReset();
  saveProfile.mockResolvedValue({ data: profile() });
  Element.prototype.scrollIntoView = vi.fn();
});

describe("PG-N1 bilah simpan menempel", () => {
  it("tidak ada tanpa perubahan; muncul saat berubah; Batalkan mengembalikan nilai", async () => {
    renderForm();
    expect(saveBar()).not.toBeInTheDocument();
    await typeInto(/Nama usaha/, "Dapur Lain");
    expect(saveBar()).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Batalkan perubahan" }));
    expect(saveBar()).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Nama usaha/)).toHaveValue(profile().business_name);
  });
  it("kembali ke nilai awal secara manual menyembunyikan bilah", async () => {
    renderForm();
    await typeInto(/Nama usaha/, "X");
    await typeInto(/Nama usaha/, profile().business_name);
    expect(saveBar()).not.toBeInTheDocument();
  });
  it("simpan sukses: Menyimpan…, toast, nilai jadi acuan baru, bilah hilang", async () => {
    let finish!: (value: unknown) => void;
    saveProfile.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderForm();
    await typeInto(/Nama usaha/, "Dapur Lain");
    await userEvent.click(saveBar()!);
    expect(screen.getByRole("button", { name: "Menyimpan…" })).toBeDisabled();
    await act(async () => {
      finish({ data: { ...profile(), business_name: "Dapur Lain" } });
    });
    expect(await screen.findByText("Pengaturan disimpan")).toBeInTheDocument();
    expect(saveBar()).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Nama usaha/)).toHaveValue("Dapur Lain");
    expect(saveProfile.mock.calls[0][0]).toMatchObject({
      business_name: "Dapur Lain",
      wa_number: "081234567890",
      hold_minutes: 5,
      pickup_point_ids: [1, 2, 3],
      service_mode: "both",
    });
  });
  it("simpan gagal: toast galat, data form tetap, bilah tetap", async () => {
    saveProfile.mockResolvedValue({
      error: { code: "INTERNAL_ERROR", message: "Pengaturan belum tersimpan. Coba lagi." },
    });
    renderForm();
    await typeInto(/Nama usaha/, "Dapur Lain");
    await userEvent.click(saveBar()!);
    expect(await screen.findByText("Pengaturan belum tersimpan. Coba lagi.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama usaha/)).toHaveValue("Dapur Lain");
    expect(saveBar()).toBeEnabled();
  });
  it("simpan melempar (jaringan putus): toast, tombol simpan aktif lagi", async () => {
    saveProfile.mockRejectedValue(new Error("Failed to fetch"));
    renderForm();
    await typeInto(/Nama usaha/, "Dapur Lain");
    await userEvent.click(saveBar()!);
    expect(await screen.findByText("Server tidak dapat dihubungi. Coba lagi.")).toBeInTheDocument();
    expect(saveBar()).toBeEnabled();
  });
});

describe("PG-E1 validasi", () => {
  it("jam tutup <= jam buka -> error dan tidak terkirim", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/Jam tutup/), { target: { value: "07:00" } });
    await userEvent.click(saveBar()!);
    expect(screen.getAllByText("Jam tutup harus setelah jam buka.").length).toBeGreaterThan(0);
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it.each(["0", "31"])("durasi %s -> error", async (minutes) => {
    renderForm();
    await typeInto(/Durasi tahan/, minutes);
    await userEvent.tab();
    expect(screen.getByText(/Durasi tahan pesanan (minimal 1|maksimal 30)/)).toBeInTheDocument();
  });
  it("tanpa titik temu -> error; ringkasan menerima fokus (G-2)", async () => {
    renderForm();
    for (const checkbox of screen.getAllByRole("checkbox")) await userEvent.click(checkbox);
    await userEvent.click(saveBar()!);
    expect(screen.getAllByText("Pilih minimal satu titik temu.").length).toBeGreaterThan(0);
    expect(screen.getByRole("alert", { name: "" })).toHaveFocus();
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it("no WA salah format -> error saat blur", async () => {
    renderForm();
    await typeInto(/Nomor WA toko/, "6281");
    await userEvent.tab();
    expect(screen.getByText(/diawali 08/)).toBeInTheDocument();
  });
  it("galat field dari server tampil di ringkasan", async () => {
    saveProfile.mockResolvedValue({
      error: { code: "VALIDATION_ERROR", message: "x", fields: { address: ["Alamat ditolak."] } },
    });
    renderForm();
    await typeInto(/Alamat/, "Jl. Baru");
    await userEvent.click(saveBar()!);
    expect((await screen.findAllByText(/Alamat ditolak\./)).length).toBeGreaterThan(0);
  });
  it("deskripsi memakai penghitung karakter", async () => {
    renderForm();
    await typeInto(/Deskripsi/, "abc");
    expect(screen.getByText("3/500 karakter")).toBeInTheDocument();
  });
});

describe("PG-E4 titik temu gagal dimuat", () => {
  it("pesan + Coba lagi di bagian itu saja; bagian lain tetap bisa dipakai", async () => {
    renderForm({ pickupPoints: null });
    await userEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(refresh).toHaveBeenCalled();
    await typeInto(/Nama usaha/, "Dapur Lain");
    expect(saveBar()).toBeInTheDocument();
  });
});

describe("PG-A2 lengkapi bagian", () => {
  it("?lengkapi=titik-temu menggulir, memfokuskan judul, dan menyorot", async () => {
    renderForm({ incompleteSection: "titik-temu" });
    const section = document.getElementById("titik-temu")!;
    await waitFor(() => expect(section.scrollIntoView).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: "Titik temu" })).toHaveFocus();
    expect(section.className).toMatch(/ring-2/);
  });
  it("sorotan hilang setelah 3 detik", async () => {
    vi.useFakeTimers();
    try {
      renderForm({ incompleteSection: "titik-temu" });
      expect(document.getElementById("titik-temu")!.className).toMatch(/ring-2/);
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      expect(document.getElementById("titik-temu")!.className).not.toMatch(/ring-2/);
    } finally {
      vi.useRealTimers();
    }
  });
  it("nilai tak dikenal diabaikan", () => {
    renderForm({ incompleteSection: "xyz" });
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("PG-A1 peringatan keluar", () => {
  it("perubahan belum disimpan + klik tautan internal -> dialog", async () => {
    renderForm();
    await typeInto(/Nama usaha/, "Dapur Lain");
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Buang perubahan?");
  });
  it("tanpa perubahan tidak ada dialog", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("link", { name: "Beranda" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Logo (M-10, FE-08); F26 QRIS toko dihapus", () => {
  const createPng = () => new File([new Uint8Array(10)], "f.png", { type: "image/png" });
  const chooseFile = (i: number) =>
    fireEvent.change(document.querySelectorAll("input[type=file]")[i] as HTMLInputElement, {
      target: { files: [createPng()] },
    });
  const withLogo = { logo_url: "https://cdn.test/logo.png" };

  it("pemilih berkas logo & background saja; gambar server tampil; tidak ada unggah QRIS", () => {
    renderForm({ profile: { ...profile(), ...withLogo } });
    expect(document.querySelectorAll("input[type=file]")).toHaveLength(2);
    expect(screen.getByAltText("Logo toko")).toBeInTheDocument();
    expect(screen.queryByText(/QRIS statis/)).not.toBeInTheDocument();
    expect(screen.queryByText(/setelah fitur unggah/)).not.toBeInTheDocument();
  });
  it("unggah logo -> memanggil uploadPhoto(berkas, 'logo'); simpan mengirim logo_url baru", async () => {
    uploadPhoto.mockResolvedValue({ data: { public_url: "https://cdn.test/baru.png" } });
    renderForm({ profile: { ...profile(), ...withLogo } });
    chooseFile(0);
    await waitFor(() => expect(saveBar()).toBeInTheDocument());
    expect(uploadPhoto.mock.calls[0][1]).toBe("logo");
    await userEvent.click(saveBar()!);
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0][0]).toMatchObject({ logo_url: "https://cdn.test/baru.png" });
    expect(saveProfile.mock.calls[0][0]).not.toHaveProperty("qris_image_url");
  });
  it("unggah background -> uploadPhoto(berkas, 'cover'); simpan mengirim cover_url baru", async () => {
    uploadPhoto.mockResolvedValue({ data: { public_url: "https://cdn.test/cover.jpg" } });
    renderForm({ profile: { ...profile(), ...withLogo } });
    chooseFile(1);
    await waitFor(() => expect(saveBar()).toBeInTheDocument());
    expect(uploadPhoto.mock.calls[0][1]).toBe("cover");
    expect(screen.getByAltText("Background toko")).toBeInTheDocument();
    await userEvent.click(saveBar()!);
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0][0]).toMatchObject({ cover_url: "https://cdn.test/cover.jpg" });
  });
  it("tanpa perubahan gambar: logo sama dengan profil", async () => {
    renderForm({ profile: { ...profile(), ...withLogo } });
    await typeInto(/Nama usaha/, "Dapur Lain");
    await userEvent.click(saveBar()!);
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0][0]).toMatchObject(withLogo);
  });
  it("unggah gagal -> pesan Indonesia, gambar lama tetap, tidak ada perubahan", async () => {
    uploadPhoto.mockResolvedValue({ error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } });
    renderForm({ profile: { ...profile(), ...withLogo } });
    chooseFile(0);
    expect(await screen.findByText("Foto gagal diunggah. Coba lagi")).toBeInTheDocument();
    expect(saveBar()).not.toBeInTheDocument();
  });
  it("selama mengunggah: status tampil dan Simpan menunggu", async () => {
    let finish!: (value: unknown) => void;
    uploadPhoto.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderForm({ profile: { ...profile(), ...withLogo } });
    await typeInto(/Nama usaha/, "Dapur Lain");
    chooseFile(0);
    expect(await screen.findByText("Mengunggah…")).toBeInTheDocument();
    expect(saveBar()).toBeDisabled();
    await act(async () => finish({ data: { public_url: "https://cdn.test/b.png" } }));
    expect(saveBar()).toBeEnabled();
  });
  it("Hapus gambar saat unggah berjalan: respons terlambat tidak menghidupkan gambar lagi", async () => {
    let finish!: (value: unknown) => void;
    uploadPhoto.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderForm({ profile: { ...profile(), ...withLogo } });
    chooseFile(0);
    await screen.findByText("Mengunggah…");
    await userEvent.click(
      within(screen.getByRole("group", { name: "Logo toko" })).getByRole("button", { name: "Hapus gambar" }),
    );
    expect(screen.queryByText("Mengunggah…")).toBeNull();
    await act(async () => finish({ data: { public_url: "https://cdn.test/terlambat.png" } }));
    expect(screen.queryByAltText("Logo toko")).toBeNull();
    expect(screen.queryByText("Logo terunggah.")).toBeNull();
    await userEvent.click(saveBar()!);
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0][0]).toMatchObject({ logo_url: null });
  });
  it("Batalkan perubahan saat unggah berjalan: respons terlambat diabaikan, form tidak kotor lagi", async () => {
    let finish!: (value: unknown) => void;
    uploadPhoto.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderForm({ profile: { ...profile(), ...withLogo } });
    await typeInto(/Nama usaha/, "Dapur Lain");
    chooseFile(0);
    await screen.findByText("Mengunggah…");
    await userEvent.click(screen.getByRole("button", { name: "Batalkan perubahan" }));
    await act(async () => finish({ data: { public_url: "https://cdn.test/terlambat.png" } }));
    expect(saveBar()).not.toBeInTheDocument();
    expect(screen.getByAltText("Logo toko")).toHaveAttribute("src", expect.stringContaining("logo.png"));
    expect(screen.queryByText("Logo terunggah.")).toBeNull();
  });
  it("memilih dua kali: hanya unggahan terakhir yang dipakai", async () => {
    const pendingResolvers: ((value: unknown) => void)[] = [];
    uploadPhoto.mockImplementation(() => new Promise((resolve) => pendingResolvers.push(resolve)));
    renderForm({ profile: { ...profile(), ...withLogo } });
    chooseFile(0);
    chooseFile(0);
    await act(async () => pendingResolvers[1]({ data: { public_url: "https://cdn.test/kedua.png" } }));
    await act(async () => pendingResolvers[0]({ data: { public_url: "https://cdn.test/pertama.png" } }));
    expect(screen.getByAltText("Logo toko")).toHaveAttribute("src", expect.stringContaining("kedua.png"));
    await userEvent.click(saveBar()!);
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0][0]).toMatchObject({ logo_url: "https://cdn.test/kedua.png" });
  });
  it("sukses diumumkan lewat role=status", async () => {
    uploadPhoto.mockResolvedValue({ data: { public_url: "https://cdn.test/baru.png" } });
    renderForm();
    chooseFile(0);
    expect(await screen.findByText("Logo terunggah.")).toHaveAttribute("role", "status");
  });
  it("kontrol foto punya id untuk tautan ringkasan galat", () => {
    renderForm();
    expect(document.getElementById("pg-logo_url")).not.toBeNull();
    expect(document.getElementById("pg-qris_image_url")).toBeNull();
  });
  it("galat server fields.logo_url tampil di bagian logo", async () => {
    saveProfile.mockResolvedValue({
      error: { code: "VALIDATION_ERROR", message: "x", fields: { logo_url: ["Foto tidak valid. Unggah ulang foto."] } },
    });
    renderForm({ profile: { ...profile(), ...withLogo } });
    await userEvent.click(
      within(screen.getByRole("group", { name: "Logo toko" })).getByRole("button", { name: "Hapus gambar" }),
    );
    await userEvent.click(saveBar()!);
    expect((await screen.findAllByText(/Foto tidak valid. Unggah ulang foto./)).length).toBeGreaterThan(0);
  });
});

describe("Setelah simpan", () => {
  it("form dibaca ulang dari respons server dan shell disegarkan", async () => {
    saveProfile.mockResolvedValue({ data: { ...profile(), business_name: "Dapur Rapi", description: null } });
    renderForm();
    await typeInto(/Nama usaha/, "  Dapur Rapi  ");
    await userEvent.click(saveBar()!);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByLabelText(/Nama usaha/)).toHaveValue("Dapur Rapi");
    expect(screen.getByLabelText(/Deskripsi/)).toHaveValue("");
    expect(saveBar()).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });
});

describe("Enter & fokus", () => {
  it("Enter tanpa perubahan tidak menyimpan", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/Nama usaha/), "{Enter}");
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it("bagian punya scroll-margin agar judul tidak tertutup header", () => {
    renderForm();
    expect(document.getElementById("titik-temu")!.className).toMatch(/scroll-mt-24/);
  });
});

describe("Akun", () => {
  it("sandi baru sama dengan lama / sandi lama > 72 karakter -> error", async () => {
    renderForm();
    await typeInto(/Kata sandi lama/, "sama12345");
    await typeInto(/^Kata sandi baru/, "sama12345");
    await typeInto(/Ulangi kata sandi baru/, "sama12345");
    await userEvent.click(screen.getByRole("button", { name: "Ganti kata sandi" }));
    expect(changePassword).not.toHaveBeenCalled();
    expect(screen.getAllByText("Kata sandi baru harus berbeda dari kata sandi lama.").length).toBeGreaterThan(0);
    await typeInto(/Kata sandi lama/, "a1".repeat(37));
    expect(screen.getAllByText("Kata sandi maksimal 72 karakter.").length).toBeGreaterThan(0);
  });
  it("menampilkan data pemilik (baca saja)", () => {
    renderForm();
    const accountSection = document.getElementById("akun")!;
    expect(accountSection).toHaveTextContent("Diego");
    expect(accountSection).toHaveTextContent("0812-3456-7890");
    expect(accountSection).toHaveTextContent("d@x.id");
  });
  it("PG-E2 kata sandi lama salah -> error di field, form tidak dikosongkan", async () => {
    changePassword.mockResolvedValue({
      error: { code: "VALIDATION_ERROR", message: "x", fields: { current_password: ["Kata sandi lama salah."] } },
    });
    renderForm();
    await typeInto(/Kata sandi lama/, "salah1234");
    await typeInto(/^Kata sandi baru/, "baru12345");
    await typeInto(/Ulangi kata sandi baru/, "baru12345");
    await userEvent.click(screen.getByRole("button", { name: "Ganti kata sandi" }));
    expect((await screen.findAllByText(/Kata sandi lama salah\./)).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Kata sandi lama/)).toHaveValue("salah1234");
  });
  it("PG-N2 sukses -> toast persis dan form kosong; tidak ada panggilan simpan toko", async () => {
    changePassword.mockResolvedValue({ data: { ok: true } });
    renderForm();
    await typeInto(/Kata sandi lama/, "lama12345");
    await typeInto(/^Kata sandi baru/, "baru12345");
    await typeInto(/Ulangi kata sandi baru/, "baru12345");
    await userEvent.click(screen.getByRole("button", { name: "Ganti kata sandi" }));
    expect(await screen.findByText("Kata sandi diganti. Perangkat lain sudah dikeluarkan.")).toBeInTheDocument();
    expect(changePassword).toHaveBeenCalledWith({ current_password: "lama12345", new_password: "baru12345" });
    expect(screen.getByLabelText(/Kata sandi lama/)).toHaveValue("");
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it("sandi baru lemah / konfirmasi beda -> tidak terkirim", async () => {
    renderForm();
    await typeInto(/Kata sandi lama/, "lama12345");
    await typeInto(/^Kata sandi baru/, "abc");
    await typeInto(/Ulangi kata sandi baru/, "abd");
    await userEvent.click(screen.getByRole("button", { name: "Ganti kata sandi" }));
    expect(changePassword).not.toHaveBeenCalled();
    expect(screen.getByText("Konfirmasi kata sandi tidak sama.")).toBeInTheDocument();
  });
});

describe("F26 rekening pencairan (di luar form utama, tersimpan langsung)", () => {
  const emptyPayouts = { ...myPayouts(), account: null, payouts: [] };
  it("belum ada rekening: form tampil, saldo & bagian toko dijelaskan, simpan tidak membuat form utama kotor", async () => {
    saveBankAccount.mockResolvedValue({ data: myPayouts() });
    renderForm({ payouts: emptyPayouts });
    const form = screen.getByRole("form", { name: "Rekening pencairan" });
    expect(screen.getByText("Rp 58.000")).toBeInTheDocument();
    expect(screen.getByText(/biaya Midtrans tidak memotong bagian toko/)).toBeInTheDocument();
    await userEvent.selectOptions(within(form).getByLabelText(/Bank atau e-wallet/), "bca");
    await userEvent.type(within(form).getByLabelText(/Nomor rekening/), "0123456789");
    await userEvent.type(within(form).getByLabelText(/Nama pemilik rekening/), "Diego Pratama");
    await userEvent.type(within(form).getByLabelText(/Kata sandi akun/), "rahasia123");
    await userEvent.click(within(form).getByRole("button", { name: "Simpan rekening" }));
    expect(saveBankAccount).toHaveBeenCalledWith({
      bank: "bca",
      account_number: "0123456789",
      account_name: "Diego Pratama",
      password: "rahasia123",
    });
    expect(await screen.findByText("Rekening pencairan disimpan")).toBeInTheDocument();
    expect(screen.getByText(/a\.n\. Diego Pratama/)).toBeInTheDocument();
    expect(saveBar()).not.toBeInTheDocument();
  });
  it("galat field dari backend (sandi salah) tampil di kolomnya", async () => {
    saveBankAccount.mockResolvedValue({
      error: { code: "VALIDATION_ERROR", message: "Data tidak valid.", fields: { password: ["Kata sandi salah."] } },
    });
    renderForm({ payouts: myPayouts() });
    await userEvent.click(screen.getByRole("button", { name: "Ganti rekening" }));
    await userEvent.click(screen.getByRole("button", { name: "Simpan rekening" }));
    expect(await screen.findByText("Kata sandi salah.")).toBeInTheDocument();
  });
  it("riwayat pencairan tampil; gagal dimuat -> pesan", () => {
    const { unmount } = renderForm({ payouts: myPayouts() });
    expect(screen.getByText(/Ref\. TRF-0001/)).toBeInTheDocument();
    unmount();
    renderForm({ payouts: null });
    expect(screen.getByText("Data pencairan belum bisa dimuat. Muat ulang halaman.")).toBeInTheDocument();
  });
});
