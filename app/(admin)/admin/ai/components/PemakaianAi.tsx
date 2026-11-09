import Link from "next/link";
import { Activity, CircleX, Coins, Timer } from "lucide-react";
import { GrafikBatang } from "@/app/components/ui/GrafikBatang";
import { KpiCard } from "@/app/components/ui/KpiCard";
import { cx, fokus } from "@/app/components/ui/cx";
import { formatJam, formatTanggal } from "@/lib/format";
import type { FiturAi, PemakaianAi as Data } from "@/types/ai";

export const RENTANG_AI = [7, 30] as const;
const FITUR: Record<FiturAi, string> = { asisten: "Asisten toko", rekomendasi: "Rekomendasi pembeli", uji: "Uji koneksi" };
const angka = (n: number) => n.toLocaleString("id-ID");
const persen = (a: number, b: number) => `${b ? Math.round((a / b) * 100) : 0}%`;
const ms = (v: number | null) => (v === null ? "-" : `${angka(v)} ms`);
const tanggalPendek = (t: string) => formatTanggal(`${t}T12:00:00+07:00`).replace(/ \d{4}$/, "");
const waktu = (iso: string) => `${formatTanggal(iso)}, ${formatJam(iso)}`;
const th = "px-3 py-2 font-medium";
const td = "px-3 py-2";

function Tabel({ judul, kolom, children }: { judul: string; kolom: string[]; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">{judul}</h3>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-subtle text-ink-muted"><tr>{kolom.map((k) => <th key={k} scope="col" className={th}>{k}</th>)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

// F25: pemakaian AI (semua fitur) — panggilan, gagal, token, latensi; per hari, per penyedia, per fitur, gagal terakhir
export function PemakaianAi({ data }: { data: Data }) {
  const r = data.ringkas;
  const n = data.per_hari.length;
  return (
    <section aria-labelledby="judul-pemakaian" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="judul-pemakaian" className="font-display text-lg font-semibold">Pemakaian</h2>
        <nav aria-label="Rentang pemakaian" className="inline-flex gap-1 rounded-md border border-line-strong p-1">
          {RENTANG_AI.map((h) => (
            <Link key={h} href={`/admin/ai?hari=${h}`} aria-current={h === data.hari ? "page" : undefined}
              className={cx("rounded px-3 py-1.5 text-sm font-medium", h === data.hari ? "bg-steel text-on-steel" : "text-ink-muted hover:text-ink", fokus)}>
              {h} hari
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={`Panggilan · ${data.hari} hari`} value={angka(r.panggilan)} icon={Activity} hint="Termasuk percobaan ke penyedia berikutnya" />
        <KpiCard label="Gagal" value={angka(r.gagal)} icon={CircleX} hint={`${persen(r.gagal, r.panggilan)} dari panggilan`} />
        <KpiCard label="Token" value={angka(r.token)} icon={Coins} hint={`Masuk ${angka(r.token_masuk)} · keluar ${angka(r.token_keluar)}`} />
        <KpiCard label="Rata-rata respons" value={ms(r.rata_ms)} icon={Timer} hint="Dari panggilan yang berhasil" />
      </div>

      <GrafikBatang judul="Token per hari" keterangan={`${data.hari} hari terakhir, tanggal WIB. Angka sesuai laporan penyedia.`}
        seri={[{ kunci: "token", nama: "Token", pendek: "token", warna: "var(--color-primary)" }]}
        data={data.per_hari.map((h) => ({ label: tanggalPendek(h.tanggal), nilai: { token: h.token } }))}
        sumbu={n <= 7 ? data.per_hari.map((_, i) => i) : [0, 7, 14, 21, n - 1]} kolomLabel="Tanggal"
        kosong={(
          <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-ink-muted">
            {r.panggilan ? "Penyedia tidak melaporkan token di rentang ini." : "Belum ada pemakaian AI di rentang ini."}
          </p>
        )} />

      {data.per_penyedia.length > 0 && (
        <>
          <Tabel judul="Per penyedia" kolom={["Penyedia", "Panggilan", "Gagal", "Token", "Rata-rata", "Terakhir dipakai"]}>
            {data.per_penyedia.map((p) => (
              <tr key={`${p.provider_id}-${p.label}-${p.model}`} className="border-t border-line align-top">
                <td className={td}><span className="font-medium">{p.label}</span><span className="block font-mono text-xs break-all text-ink-muted">{p.model}</span></td>
                <td className={cx(td, "font-mono")}>{angka(p.panggilan)}</td>
                <td className={cx(td, "font-mono", p.gagal > 0 && "text-danger")}>{angka(p.gagal)}{p.gagal > 0 && ` (${persen(p.gagal, p.panggilan)})`}</td>
                <td className={cx(td, "font-mono")}>{angka(p.token)}</td>
                <td className={cx(td, "font-mono whitespace-nowrap")}>{ms(p.rata_ms)}</td>
                <td className={cx(td, "whitespace-nowrap")}>{waktu(p.terakhir)}</td>
              </tr>
            ))}
          </Tabel>
          <div className="grid gap-4 xl:grid-cols-[2fr_3fr]">
            <Tabel judul="Per fitur" kolom={["Fitur", "Panggilan", "Gagal", "Token"]}>
              {data.per_fitur.map((f) => (
                <tr key={f.fitur} className="border-t border-line">
                  <td className={td}>{FITUR[f.fitur] ?? f.fitur}</td>
                  <td className={cx(td, "font-mono")}>{angka(f.panggilan)}</td>
                  <td className={cx(td, "font-mono", f.gagal > 0 && "text-danger")}>{angka(f.gagal)}</td>
                  <td className={cx(td, "font-mono")}>{angka(f.token)}</td>
                </tr>
              ))}
            </Tabel>
            {data.gagal_terakhir.length ? (
              <Tabel judul="Gagal terakhir" kolom={["Waktu (WIB)", "Penyedia", "Fitur", "Pesan"]}>
                {data.gagal_terakhir.map((g, i) => (
                  <tr key={`${g.created_at}-${i}`} className="border-t border-line align-top">
                    <td className={cx(td, "whitespace-nowrap")}>{waktu(g.created_at)}</td>
                    <td className={td}>{g.label}</td>
                    <td className={td}>{FITUR[g.fitur] ?? g.fitur}</td>
                    <td className={cx(td, "text-danger")}>{g.error ?? "-"}</td>
                  </tr>
                ))}
              </Tabel>
            ) : (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">Gagal terakhir</h3>
                <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-ink-muted">Tidak ada panggilan gagal.</p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
