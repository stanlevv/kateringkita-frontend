// Komponen AdminTable: tabel akun admin di /admin/admin beserta dialog tambah admin, sandi sementara, dan konfirmasi.
// Perubahan dikirim lewat server action createAdmin, updateAdminLevel, setAdminActive, dan resetAdminPassword
// (app/actions/admin/accounts.ts). Server action = fungsi di server Next.js yang dipanggil dari peramban.
// Tingkat admin: super (semua fitur), ops (operasional), support (tiket bantuan), lihat lib/admin-level.ts.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state dan router.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, KeyRound, PowerOff, UserCog } from "lucide-react";
import { createAdmin, resetAdminPassword, setAdminActive, updateAdminLevel } from "@/app/actions/admin/accounts";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { Dialog } from "@/app/components/ui/Dialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Field } from "@/app/components/ui/Field";
import { Input, Select } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { LEVEL_DESCRIPTIONS, LEVEL_LABELS, type AdminLevel } from "@/lib/admin-level";
import { formatTime, formatDate } from "@/lib/format";
import type { AdminWithPassword, AdminAccount } from "@/types/admin";
import type { ActionResult } from "@/types/api";

// Semua tingkat admin, untuk pilihan di formulir dan di tabel.
const LEVELS = Object.keys(LEVEL_LABELS) as AdminLevel[];

// Teks dialog konfirmasi per aksi akun. Setiap aksi lewat konfirmasi, karena tombol "Aktifkan" tanpa konfirmasi bisa
// dipicu clickjacking (pengguna ditipu mengeklik dua kali tombol yang disembunyikan di halaman lain).
const CONFIRMATIONS = {
  reset: {
    title: "Reset kata sandi?",
    confirmLabel: "Reset sandi",
    body: (name: string) =>
      `${name} dikeluarkan dari semua perangkat dan harus masuk dengan kata sandi sementara baru.`,
  },
  deactivate: {
    title: "Nonaktifkan admin?",
    confirmLabel: "Nonaktifkan",
    body: (name: string) => `${name} tidak bisa masuk lagi dan dikeluarkan dari semua perangkat.`,
  },
  activate: {
    title: "Aktifkan admin?",
    confirmLabel: "Ya, aktifkan",
    body: (name: string) => `${name} bisa masuk lagi dengan kata sandinya yang lama.`,
  },
};

/**
 * Formulir tambah admin (nama, nomor HP, tingkat). Backend membuat akun dengan sandi sementara.
 * @param props.onSaved dipanggil dengan data admin baru dan sandi sementaranya
 * @param props.onClose menutup dialog
 * @returns formulir
 */
function AdminForm({ onSaved, onClose }: { onSaved: (createdAdmin: AdminWithPassword) => void; onClose: () => void }) {
  // 1. Isian (kuncinya sama dengan field API), galat per isian dari backend, dan tanda sedang menyimpan.
  const [values, setValues] = useState({ full_name: "", phone: "", admin_level: "ops" as AdminLevel });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // 2. Kirim ke server; galat per isian tampil di bawah isian, pesan umum jadi toast.
  async function submit(event: React.FormEvent) {
    // 1. Cegah kirim ganda, lalu panggil server action.
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const result = await callAction(() => createAdmin(values));
    setSaving(false);
    // 2. Gagal: tandai isian yang salah dan tampilkan toast. Berhasil: serahkan admin baru ke pemanggil.
    if ("error" in result) {
      if (result.error.fields)
        setErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
      toast({ tone: "danger", message: result.error.message });
      return;
    }
    onSaved(result.data);
  }
  // 3. Mengubah satu isian sekaligus menghapus galat lama.
  const setField = (field: keyof typeof values, value: string) => {
    setErrors({});
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Nama lengkap" id="fa-full_name" required error={errors.full_name}>
        <Input
          value={values.full_name}
          maxLength={150}
          onChange={(event) => setField("full_name", event.target.value)}
          autoFocus
        />
      </Field>
      <Field label="Nomor HP" id="fa-phone" required help="Dipakai untuk masuk. Diawali 08." error={errors.phone}>
        <Input
          inputMode="numeric"
          value={values.phone}
          maxLength={13}
          onChange={(event) => setField("phone", event.target.value)}
        />
      </Field>
      <Field
        label="Tingkat"
        id="fa-admin_level"
        required
        help={LEVEL_DESCRIPTIONS[values.admin_level]}
        error={errors.admin_level}
      >
        <Select value={values.admin_level} onChange={(event) => setField("admin_level", event.target.value)}>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {LEVEL_LABELS[level]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" loading={saving} loadingText="Membuat…">
          Buat akun
        </Button>
      </div>
    </form>
  );
}

/**
 * Menampilkan nomor HP dan sandi sementara admin (baru dibuat atau direset) dengan tombol salin. Sandi hanya tampil
 * sekali; setelah dialog ditutup tidak bisa dilihat lagi.
 * @param props.data admin dan sandi sementaranya dari backend
 * @param props.onClose menutup dialog
 * @returns isi dialog
 */
function TemporaryPasswordNotice({ data, onClose }: { data: AdminWithPassword; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink">
        Berikan data masuk ini ke <span className="font-semibold">{data.admin.full_name}</span> lewat jalur pribadi.
        Kata sandi hanya tampil sekali dan wajib diganti saat pertama masuk.
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border border-line bg-subtle p-3 text-sm">
        <dt className="text-ink-muted">Nomor HP</dt>
        <dd className="font-mono">{data.admin.phone}</dd>
        <dt className="text-ink-muted">Kata sandi</dt>
        <dd className="select-all font-mono font-semibold">{data.temp_password}</dd>
      </dl>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={() => {
            void navigator.clipboard
              ?.writeText(`Nomor HP: ${data.admin.phone}\nKata sandi: ${data.temp_password}`)
              .then(
                () => toast({ tone: "success", message: "Disalin" }),
                () => toast({ tone: "danger", message: "Gagal menyalin. Salin manual." }),
              );
          }}
        >
          Salin
        </Button>
        <Button onClick={onClose}>Selesai</Button>
      </div>
    </div>
  );
}

/**
 * Tabel akun admin dengan aksi ubah tingkat, nonaktifkan/aktifkan, dan reset sandi. Akun sendiri tidak bisa diubah di
 * sini (diubah lewat Pengaturan akun).
 * @param props.rows daftar admin dari backend
 * @param props.currentAdminId id admin yang sedang masuk
 * @returns tombol tambah, tabel (atau keadaan kosong), dan dialog-dialognya
 */
export function AdminTable({ rows, currentAdminId }: { rows: AdminAccount[]; currentAdminId: number }) {
  // 1. State: dialog tambah terbuka, sandi sementara yang sedang ditampilkan, konfirmasi yang menunggu, tanda sibuk.
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [credentials, setCredentials] = useState<AdminWithPassword | null>(null);
  const [confirmation, setConfirmation] = useState<{ admin: AdminAccount; action: keyof typeof CONFIRMATIONS } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  // 2. Menjalankan satu aksi akun: tutup konfirmasi, tampilkan toast, lalu muat ulang data (router.refresh).
  //    Mengembalikan data hasil aksi (dipakai reset sandi), atau null bila gagal.
  async function runAction<T>(request: () => Promise<ActionResult<T>>, successMessage: string) {
    setBusy(true);
    const result = await callAction(request);
    setBusy(false);
    setConfirmation(null);
    if ("error" in result) {
      toast({ tone: "danger", message: result.error.message });
      return null;
    }
    toast({ tone: "success", message: successMessage });
    router.refresh();
    return result.data;
  }

  // 3. Kolom tabel. Akun sendiri tidak punya pilihan tingkat dan tombol aksi; admin nonaktif hanya bisa diaktifkan.
  const columns: Column<AdminAccount>[] = [
    {
      key: "nama",
      header: "Admin",
      wrap: true,
      cell: (admin) => (
        <div>
          <span className="font-semibold">{admin.full_name}</span>
          {admin.id === currentAdminId && <span className="text-ink-muted"> (Anda)</span>}
          <div className="text-sm text-ink-muted">{admin.phone}</div>
        </div>
      ),
    },
    {
      key: "level",
      header: "Tingkat",
      cell: (admin) =>
        admin.id === currentAdminId || !admin.is_active ? (
          <span>{admin.admin_level ? LEVEL_LABELS[admin.admin_level] : "-"}</span>
        ) : (
          <Select
            aria-label={`Tingkat ${admin.full_name}`}
            value={admin.admin_level ?? ""}
            disabled={busy}
            onChange={(event) =>
              void runAction(() => updateAdminLevel(admin.id, event.target.value as AdminLevel), "Tingkat diubah")
            }
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {LEVEL_LABELS[level]}
              </option>
            ))}
          </Select>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (admin) =>
        !admin.is_active ? (
          <Badge tone="neutral" icon={PowerOff}>
            Nonaktif
          </Badge>
        ) : admin.must_change_password ? (
          <Badge tone="warning" icon={KeyRound}>
            Belum ganti sandi
          </Badge>
        ) : (
          <Badge tone="success" icon={CircleCheck}>
            Aktif
          </Badge>
        ),
    },
    {
      key: "masuk",
      header: "Terakhir masuk",
      cell: (admin) =>
        admin.last_login_at ? `${formatDate(admin.last_login_at)} ${formatTime(admin.last_login_at)}` : "Belum pernah",
    },
    {
      key: "aksi",
      header: "Aksi",
      cell: (admin) =>
        admin.id === currentAdminId ? (
          <span className="text-sm text-ink-muted">Ubah di Pengaturan akun</span>
        ) : (
          <div className="flex items-center gap-2">
            {admin.is_active ? (
              <>
                <Button
                  variant="secondary"
                  aria-label={`Reset sandi ${admin.full_name}`}
                  onClick={() => setConfirmation({ admin, action: "reset" })}
                >
                  Reset sandi
                </Button>
                <Button
                  variant="secondary"
                  aria-label={`Nonaktifkan ${admin.full_name}`}
                  onClick={() => setConfirmation({ admin, action: "deactivate" })}
                >
                  Nonaktifkan
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                aria-label={`Aktifkan ${admin.full_name}`}
                disabled={busy}
                onClick={() => setConfirmation({ admin, action: "activate" })}
              >
                Aktifkan
              </Button>
            )}
          </div>
        ),
    },
  ];

  // 4. Tombol tambah dipakai di dua tempat (keadaan kosong dan di atas tabel).
  const addButton = <Button onClick={() => setFormOpen(true)}>Tambah admin</Button>;
  const activeConfirmation = confirmation;
  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Belum ada admin"
          body="Tambahkan admin agar panel bisa dikelola bersama."
          action={addButton}
        />
      ) : (
        <>
          <div>{addButton}</div>
          <DataTable caption="Akun admin" columns={columns} rows={rows} rowKey={(admin) => String(admin.id)} />
        </>
      )}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title="Tambah admin">
        <AdminForm
          onClose={() => setFormOpen(false)}
          onSaved={(createdAdmin) => {
            setFormOpen(false);
            setCredentials(createdAdmin);
            router.refresh();
          }}
        />
      </Dialog>
      <Dialog open={!!credentials} onClose={() => setCredentials(null)} title="Akun admin siap">
        {credentials && <TemporaryPasswordNotice data={credentials} onClose={() => setCredentials(null)} />}
      </Dialog>
      <ConfirmDialog
        open={!!activeConfirmation}
        onClose={() => setConfirmation(null)}
        tone={activeConfirmation?.action === "activate" ? "primary" : "danger"}
        busy={busy}
        title={CONFIRMATIONS[activeConfirmation?.action ?? "deactivate"].title}
        body={CONFIRMATIONS[activeConfirmation?.action ?? "deactivate"].body(activeConfirmation?.admin.full_name ?? "")}
        confirmLabel={CONFIRMATIONS[activeConfirmation?.action ?? "deactivate"].confirmLabel}
        onConfirm={() => {
          if (!activeConfirmation) return;
          if (activeConfirmation.action === "deactivate")
            void runAction(() => setAdminActive(activeConfirmation.admin.id, false), "Dinonaktifkan");
          else if (activeConfirmation.action === "activate")
            void runAction(() => setAdminActive(activeConfirmation.admin.id, true), "Diaktifkan");
          else
            void runAction(() => resetAdminPassword(activeConfirmation.admin.id), "Kata sandi direset").then(
              (newCredentials) => newCredentials && setCredentials(newCredentials),
            );
        }}
      />
    </div>
  );
}
