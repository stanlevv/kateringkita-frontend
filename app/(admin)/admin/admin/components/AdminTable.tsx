"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, KeyRound, PowerOff, UserCog } from "lucide-react";
import { buatAdmin, resetSandiAdmin, setAktifAdmin, ubahLevelAdmin } from "@/app/actions/admin/akun";
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

const LEVEL = Object.keys(LEVEL_LABELS) as AdminLevel[];

// AUD-35: setiap aksi akun lewat konfirmasi; "Aktifkan" tanpa konfirmasi bisa dipicu clickjacking dua kali klik
const KONFIRMASI = {
  reset: {
    judul: "Reset kata sandi?",
    tombol: "Reset sandi",
    isi: (n: string) => `${n} dikeluarkan dari semua perangkat dan harus masuk dengan kata sandi sementara baru.`,
  },
  nonaktif: {
    judul: "Nonaktifkan admin?",
    tombol: "Nonaktifkan",
    isi: (n: string) => `${n} tidak bisa masuk lagi dan dikeluarkan dari semua perangkat.`,
  },
  aktif: {
    judul: "Aktifkan admin?",
    tombol: "Ya, aktifkan",
    isi: (n: string) => `${n} bisa masuk lagi dengan kata sandinya yang lama.`,
  },
};

function FormAdmin({ onSaved, onClose }: { onSaved: (r: AdminWithPassword) => void; onClose: () => void }) {
  const [v, setV] = useState({ full_name: "", phone: "", admin_level: "ops" as AdminLevel });
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [menyimpan, setMenyimpan] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (menyimpan) return;
    setMenyimpan(true);
    const r = await callAction(() => buatAdmin(v));
    setMenyimpan(false);
    if ("error" in r) {
      if (r.error.fields) setGalat(Object.fromEntries(Object.entries(r.error.fields).map(([k, m]) => [k, m[0]])));
      toast({ tone: "danger", message: r.error.message });
      return;
    }
    onSaved(r.data);
  }
  const set = (k: keyof typeof v, nilai: string) => {
    setGalat({});
    setV((p) => ({ ...p, [k]: nilai }));
  };

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
      <Field label="Nama lengkap" id="fa-full_name" required error={galat.full_name}>
        <Input value={v.full_name} maxLength={150} onChange={(e) => set("full_name", e.target.value)} autoFocus />
      </Field>
      <Field label="Nomor HP" id="fa-phone" required help="Dipakai untuk masuk. Diawali 08." error={galat.phone}>
        <Input inputMode="numeric" value={v.phone} maxLength={13} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <Field
        label="Tingkat"
        id="fa-admin_level"
        required
        help={LEVEL_DESCRIPTIONS[v.admin_level]}
        error={galat.admin_level}
      >
        <Select value={v.admin_level} onChange={(e) => set("admin_level", e.target.value)}>
          {LEVEL.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABELS[l]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" loading={menyimpan} loadingText="Membuat…">
          Buat akun
        </Button>
      </div>
    </form>
  );
}

// Sandi sementara tampil sekali; tidak bisa dilihat lagi setelah dialog ditutup.
function SandiSementara({ data, onClose }: { data: AdminWithPassword; onClose: () => void }) {
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

/** Fase 1 — kelola akun admin (khusus super). Akun sendiri tidak bisa diubah di sini. */
export function AdminTable({ rows, sayaId }: { rows: AdminAccount[]; sayaId: number }) {
  const router = useRouter();
  const [form, setForm] = useState(false);
  const [sandi, setSandi] = useState<AdminWithPassword | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<{ a: AdminAccount; aksi: keyof typeof KONFIRMASI } | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function jalankan<T>(fn: () => Promise<ActionResult<T>>, pesan: string) {
    setSibuk(true);
    const r = await callAction(fn);
    setSibuk(false);
    setKonfirmasi(null);
    if ("error" in r) {
      toast({ tone: "danger", message: r.error.message });
      return null;
    }
    toast({ tone: "success", message: pesan });
    router.refresh();
    return r.data;
  }

  const kolom: Column<AdminAccount>[] = [
    {
      key: "nama",
      header: "Admin",
      wrap: true,
      cell: (a) => (
        <div>
          <span className="font-semibold">{a.full_name}</span>
          {a.id === sayaId && <span className="text-ink-muted"> (Anda)</span>}
          <div className="text-sm text-ink-muted">{a.phone}</div>
        </div>
      ),
    },
    {
      key: "level",
      header: "Tingkat",
      cell: (a) =>
        a.id === sayaId || !a.is_active ? (
          <span>{a.admin_level ? LEVEL_LABELS[a.admin_level] : "-"}</span>
        ) : (
          <Select
            aria-label={`Tingkat ${a.full_name}`}
            value={a.admin_level ?? ""}
            disabled={sibuk}
            onChange={(e) => void jalankan(() => ubahLevelAdmin(a.id, e.target.value as AdminLevel), "Tingkat diubah")}
          >
            {LEVEL.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </Select>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (a) =>
        !a.is_active ? (
          <Badge tone="neutral" icon={PowerOff}>
            Nonaktif
          </Badge>
        ) : a.must_change_password ? (
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
      cell: (a) => (a.last_login_at ? `${formatDate(a.last_login_at)} ${formatTime(a.last_login_at)}` : "Belum pernah"),
    },
    {
      key: "aksi",
      header: "Aksi",
      cell: (a) =>
        a.id === sayaId ? (
          <span className="text-sm text-ink-muted">Ubah di Pengaturan akun</span>
        ) : (
          <div className="flex items-center gap-2">
            {a.is_active ? (
              <>
                <Button
                  variant="secondary"
                  aria-label={`Reset sandi ${a.full_name}`}
                  onClick={() => setKonfirmasi({ a, aksi: "reset" })}
                >
                  Reset sandi
                </Button>
                <Button
                  variant="secondary"
                  aria-label={`Nonaktifkan ${a.full_name}`}
                  onClick={() => setKonfirmasi({ a, aksi: "nonaktif" })}
                >
                  Nonaktifkan
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                aria-label={`Aktifkan ${a.full_name}`}
                disabled={sibuk}
                onClick={() => setKonfirmasi({ a, aksi: "aktif" })}
              >
                Aktifkan
              </Button>
            )}
          </div>
        ),
    },
  ];

  const tambah = <Button onClick={() => setForm(true)}>Tambah admin</Button>;
  const k = konfirmasi;
  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Belum ada admin"
          body="Tambahkan admin agar panel bisa dikelola bersama."
          action={tambah}
        />
      ) : (
        <>
          <div>{tambah}</div>
          <DataTable caption="Akun admin" columns={kolom} rows={rows} rowKey={(a) => String(a.id)} />
        </>
      )}
      <Dialog open={form} onClose={() => setForm(false)} title="Tambah admin">
        <FormAdmin
          onClose={() => setForm(false)}
          onSaved={(r) => {
            setForm(false);
            setSandi(r);
            router.refresh();
          }}
        />
      </Dialog>
      <Dialog open={!!sandi} onClose={() => setSandi(null)} title="Akun admin siap">
        {sandi && <SandiSementara data={sandi} onClose={() => setSandi(null)} />}
      </Dialog>
      <ConfirmDialog
        open={!!k}
        onClose={() => setKonfirmasi(null)}
        tone={k?.aksi === "aktif" ? "primary" : "danger"}
        busy={sibuk}
        title={KONFIRMASI[k?.aksi ?? "nonaktif"].judul}
        body={KONFIRMASI[k?.aksi ?? "nonaktif"].isi(k?.a.full_name ?? "")}
        confirmLabel={KONFIRMASI[k?.aksi ?? "nonaktif"].tombol}
        onConfirm={() => {
          if (!k) return;
          if (k.aksi === "nonaktif") void jalankan(() => setAktifAdmin(k.a.id, false), "Dinonaktifkan");
          else if (k.aksi === "aktif") void jalankan(() => setAktifAdmin(k.a.id, true), "Diaktifkan");
          else void jalankan(() => resetSandiAdmin(k.a.id), "Kata sandi direset").then((d) => d && setSandi(d));
        }}
      />
    </div>
  );
}
