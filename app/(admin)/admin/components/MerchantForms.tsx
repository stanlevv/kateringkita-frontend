// Komponen form penjual di panel admin: tambah penjual (halaman /admin/penjual/baru) dan kelola penjual (ubah profil
// toko dan akun pemilik di halaman detail). Semua form memakai AdminForm dan server action app/actions/admin/merchant-edit.
// "use client": berisi fungsi validasi dan pemanggil server action yang tidak bisa dikirim dari server component.
"use client";

import { createMerchant, updateMerchantOwner, updateMerchantStore } from "@/app/actions/admin/merchant-edit";
import { adminAccountSchema, adminMerchantCreateSchema, adminStoreSchema, validateFields } from "@/lib/schemas";
import { AdminForm, type AdminFormField } from "./AdminForm";

const WA_HELP = "Diawali 08, 10–13 digit.";
const OWNER_FIELDS: AdminFormField[] = [
  { name: "full_name", label: "Nama pemilik", required: true, autoComplete: "off" },
  { name: "phone", label: "Nomor WA login", type: "tel", required: true, digitsOnly: true, help: WA_HELP },
  { name: "email", label: "Email", type: "email", help: "Opsional untuk penjual." },
];
const STORE_FIELDS: AdminFormField[] = [
  { name: "business_name", label: "Nama usaha", required: true },
  { name: "address", label: "Alamat", required: true },
  { name: "wa_number", label: "Nomor WA toko", type: "tel", required: true, digitsOnly: true, help: WA_HELP },
  { name: "description", label: "Deskripsi", type: "textarea" },
];

/**
 * Form tambah penjual: akun pemilik dan toko. Setelah tersimpan pindah ke detail penjual baru.
 * @param props.merchantTypes daftar jenis usaha aktif
 * @returns AdminForm
 */
export function MerchantCreateForm({ merchantTypes }: { merchantTypes: { id: number; name: string }[] }) {
  const fields: AdminFormField[] = [
    ...OWNER_FIELDS,
    {
      name: "password",
      label: "Sandi awal",
      type: "password",
      required: true,
      autoComplete: "new-password",
      help: "Minimal 8 karakter, ada huruf dan angka. Sampaikan ke penjual; ia bisa menggantinya di Pengaturan.",
    },
    { name: "business_name", label: "Nama usaha", required: true },
    {
      name: "merchant_type_id",
      label: "Jenis usaha",
      type: "select",
      required: true,
      options: merchantTypes.map((type) => ({ value: String(type.id), label: type.name })),
    },
    { name: "address", label: "Alamat", required: true },
  ];
  return (
    <AdminForm
      id="tambah-penjual"
      fields={fields}
      initial={Object.fromEntries(fields.map((field) => [field.name, ""]))}
      validate={(values) => validateFields(adminMerchantCreateSchema, values)}
      submit={createMerchant}
      submitLabel="Tambah penjual"
      successMessage="Penjual ditambahkan"
      afterSave={{ goTo: "/admin/penjual/{id}" }}
    />
  );
}

/**
 * Form kelola penjual di halaman detail: profil toko dan akun pemilik.
 * @param props.merchantId id toko
 * @param props.store      nilai awal profil toko
 * @param props.owner      nilai awal akun pemilik
 * @returns dua AdminForm
 */
export function MerchantManageForms({
  merchantId,
  store,
  owner,
}: {
  merchantId: number;
  store: { business_name: string; address: string; wa_number: string; description: string };
  owner: { full_name: string; phone: string; email: string };
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <AdminForm
        id="ubah-toko"
        title="Profil toko"
        fields={STORE_FIELDS}
        initial={store}
        validate={(values) => validateFields(adminStoreSchema, values)}
        submit={(values) => updateMerchantStore(merchantId, values)}
        submitLabel="Simpan profil toko"
        successMessage="Profil toko disimpan"
      />
      <AdminForm
        id="ubah-pemilik"
        title="Akun pemilik"
        fields={OWNER_FIELDS}
        initial={owner}
        validate={(values) => validateFields(adminAccountSchema, values)}
        submit={(values) => updateMerchantOwner(merchantId, values)}
        submitLabel="Simpan akun pemilik"
        successMessage="Akun pemilik disimpan"
      />
    </div>
  );
}
