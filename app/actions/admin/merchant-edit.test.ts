// Test server action panel admin untuk penjual dan pembeli (app/actions/admin/merchant-edit.ts dan customers.ts):
// validasi sebelum memanggil backend, kolom yang dikirim, dan alamat backend. Sesi dan backend dipalsukan (vi.mock).
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
import { createCustomer, setCustomerActive, updateCustomer } from "./customers";
import {
  createMerchant,
  deleteMerchantMenu,
  saveMerchantMenu,
  setMerchantAccountActive,
  updateMerchantOwner,
  updateMerchantStore,
} from "./merchant-edit";

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset().mockResolvedValue({ ok: true, status: 200, data: { id: 9 } });
});
const lastBody = () => JSON.parse(adminFetch.mock.calls.at(-1)?.[1]?.body ?? "null");

describe("penjual", () => {
  it("tambah: jenis usaha jadi angka, email kosong tidak dikirim, kolom asing dibuang", async () => {
    const input = {
      full_name: " Rina ",
      phone: "081255556666",
      email: "",
      password: "rahasia123",
      business_name: "Dapur Rina",
      merchant_type_id: "2",
      address: "Jl. Melati",
      is_admin: "1",
    };
    expect(await createMerchant(input)).toEqual({ data: { id: 9 } });
    expect(adminFetch.mock.calls[0][0]).toBe("/merchants");
    expect(lastBody()).toEqual({
      full_name: "Rina",
      phone: "081255556666",
      password: "rahasia123",
      business_name: "Dapur Rina",
      merchant_type_id: 2,
      address: "Jl. Melati",
    });
  });

  it("tambah: isian salah ditolak tanpa backend", async () => {
    expect(await createMerchant({ full_name: "", phone: "12", password: "abc" })).toMatchObject({
      error: { code: "VALIDATION_ERROR", fields: { full_name: expect.any(Array), phone: expect.any(Array) } },
    });
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it("ubah toko, ubah pemilik, status akun ke alamat yang benar; id tidak valid ditolak", async () => {
    await updateMerchantStore(5, {
      business_name: "Baru",
      address: "Jl. A",
      wa_number: "081211112222",
      description: "",
    });
    expect(adminFetch).toHaveBeenLastCalledWith("/merchants/5", expect.objectContaining({ method: "PATCH" }));
    await updateMerchantOwner(5, { full_name: "Siti", phone: "081298765432", email: "" });
    expect(adminFetch).toHaveBeenLastCalledWith("/merchants/5/owner", expect.objectContaining({ method: "PATCH" }));
    expect(lastBody()).toEqual({ full_name: "Siti", phone: "081298765432", email: "" });
    await setMerchantAccountActive(5, false);
    expect(adminFetch).toHaveBeenLastCalledWith("/merchants/5/account/deactivate", { method: "POST" });
    adminFetch.mockClear();
    expect(await updateMerchantStore(0, {})).toMatchObject({ error: { code: "NOT_FOUND" } });
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it("menu: baru POST, lama PATCH, hapus DELETE; isian menu salah ditolak", async () => {
    const menu = {
      name: "Nasi Box",
      category_id: 1,
      description: "",
      image_url: null,
      unit_label: "porsi",
      price: 15000,
      hpp: 9000,
      daily_quota: 20,
      prep_minutes: 15,
      is_preorder: false,
      preorder_days: 0,
      min_order_qty: 1,
      options: [],
      gallery: [],
    };
    await saveMerchantMenu(5, null, menu);
    expect(adminFetch).toHaveBeenLastCalledWith("/merchants/5/menus", expect.objectContaining({ method: "POST" }));
    await saveMerchantMenu(5, 3, menu);
    expect(adminFetch).toHaveBeenLastCalledWith("/merchants/5/menus/3", expect.objectContaining({ method: "PATCH" }));
    adminFetch.mockResolvedValue({ ok: true, status: 204, data: null });
    expect(await deleteMerchantMenu(5, 3)).toEqual({ data: null });
    expect(adminFetch).toHaveBeenLastCalledWith("/merchants/5/menus/3", { method: "DELETE" });
    adminFetch.mockClear();
    expect(await saveMerchantMenu(5, null, { ...menu, price: 5000 })).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(adminFetch).not.toHaveBeenCalled();
  });
});

describe("pembeli", () => {
  it("tambah dan ubah: email wajib; status akun ke alamat yang benar", async () => {
    await createCustomer({ full_name: "Dewi", phone: "081277778888", email: "dewi@mail.com", password: "rahasia123" });
    expect(adminFetch).toHaveBeenLastCalledWith("/customers", expect.objectContaining({ method: "POST" }));
    adminFetch.mockClear();
    expect(await updateCustomer(4, { full_name: "Dewi", phone: "081277778888", email: "" })).toMatchObject({
      error: { fields: { email: ["Email wajib diisi."] } },
    });
    expect(adminFetch).not.toHaveBeenCalled();
    await updateCustomer(4, { full_name: "Dewi L", phone: "081277778888", email: "dewi@mail.com" });
    expect(adminFetch).toHaveBeenLastCalledWith("/customers/4", expect.objectContaining({ method: "PATCH" }));
    await setCustomerActive(4, true);
    expect(adminFetch).toHaveBeenLastCalledWith("/customers/4/activate", { method: "POST" });
  });
});
