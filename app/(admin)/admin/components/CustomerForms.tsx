// Komponen form pembeli di panel admin: tambah pembeli (halaman /admin/pembeli/baru) dan ubah data pembeli (halaman
// detail). Keduanya memakai AdminForm dan server action app/actions/admin/customers.
// "use client": berisi fungsi validasi dan pemanggil server action yang tidak bisa dikirim dari server component.
"use client";

import { createCustomer, updateCustomer } from "@/app/actions/admin/customers";
import { adminAccountSchema, adminCustomerCreateSchema, validateFields } from "@/lib/schemas";
import { AdminForm, type AdminFormField } from "./AdminForm";

const ACCOUNT_FIELDS: AdminFormField[] = [
  { name: "full_name", label: "Nama lengkap", required: true, autoComplete: "off" },
  { name: "phone", label: "Nomor WA", type: "tel", required: true, digitsOnly: true, help: "Diawali 08, 10–13 digit." },
  { name: "email", label: "Email", type: "email", required: true },
];

/**
 * Form tambah pembeli. Setelah tersimpan pindah ke detail pembeli baru.
 * @returns AdminForm
 */
export function CustomerCreateForm() {
  const fields: AdminFormField[] = [
    ...ACCOUNT_FIELDS,
    {
      name: "password",
      label: "Sandi awal",
      type: "password",
      required: true,
      autoComplete: "new-password",
      help: "Minimal 8 karakter, ada huruf dan angka. Sampaikan ke pembeli; ia bisa menggantinya di aplikasi.",
    },
  ];
  return (
    <AdminForm
      id="tambah-pembeli"
      fields={fields}
      initial={{ full_name: "", phone: "", email: "", password: "" }}
      validate={(values) => validateFields(adminCustomerCreateSchema, values)}
      submit={createCustomer}
      submitLabel="Tambah pembeli"
      successMessage="Pembeli ditambahkan"
      afterSave={{ goTo: "/admin/pembeli/{id}" }}
    />
  );
}

/**
 * Form ubah data pembeli di halaman detail.
 * @param props.customerId id pembeli
 * @param props.initial    nilai awal nama, nomor WA, email
 * @returns AdminForm
 */
export function CustomerEditForm({
  customerId,
  initial,
}: {
  customerId: number;
  initial: { full_name: string; phone: string; email: string };
}) {
  return (
    <AdminForm
      id="ubah-pembeli"
      title="Data pembeli"
      fields={ACCOUNT_FIELDS}
      initial={initial}
      validate={(values) => {
        const errors = validateFields(adminAccountSchema, values);
        if (!values.email?.trim()) errors.email = "Email wajib diisi.";
        return errors;
      }}
      submit={(values) => updateCustomer(customerId, values)}
      submitLabel="Simpan data pembeli"
      successMessage="Data pembeli disimpan"
    />
  );
}
