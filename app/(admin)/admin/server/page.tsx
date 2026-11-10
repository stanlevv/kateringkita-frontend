import { Suspense } from "react";
import { CircleX, Clock, Database, Server } from "lucide-react";
import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { KpiCard } from "@/app/components/ui/KpiCard";
import { Pagination } from "@/app/components/ui/Pagination";
import { cx } from "@/app/components/ui/cx";
import { formatJam, formatTanggal } from "@/lib/format";
import { getLogServer, getStatusServer, LIMIT_LOG_SERVER } from "@/services/adminServerService";
import { requireAdmin } from "@/services/authService";
import type { LogServer } from "@/types/server";
import { FilterLogServer } from "./components/FilterLogServer";
import { GrafikPerJam } from "./components/GrafikPerJam";

const lama = (s: number) => {
  const h = Math.floor(s / 86400), j = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return [h && `${h} hr`, j && `${j} j`, `${m} mnt`].filter(Boolean).join(" ");
};

function Level({ l }: { l: LogServer["level"] }) {
  return l === "error"
    ? <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger"><CircleX aria-hidden className="size-3.5" />Error</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning"><Clock aria-hidden className="size-3.5" />Lambat</span>;
}

// F23: kondisi server, masalah per jam, dan log error 5xx & request lambat (30 hari)
export default async function ServerPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("super");
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.level === "error" || sp.level === "slow") q.set("level", sp.level);
  if (sp.q) q.set("q", sp.q.slice(0, 128));
  const n = Number(sp.page);
  const page = Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : 1;
  const hrefFor = (p: number) => `/admin/server?${new URLSearchParams({ ...Object.fromEntries(q), page: String(p) })}`;
  q.set("page", String(page));
  q.set("limit", String(LIMIT_LOG_SERVER));
  const [st, log] = await Promise.all([getStatusServer(), getLogServer(q)]);
  const total = (log.meta as { total?: number } | undefined)?.total ?? log.data?.length ?? 0;

  return (
    <PageHeader title="Server" description="Kondisi backend, error 5xx, dan request lambat. Log disimpan 30 hari.">
      <div className="flex flex-col gap-6">
        {"error" in st ? (
          <GagalMuat judul="Status server belum bisa dimuat" isi="Backend tidak menjawab. Coba lagi sebentar lagi." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Error 5xx · 24 jam" value={st.data.ringkas_24j.error} icon={CircleX} />
              <KpiCard label="Lambat > 2 dtk · 24 jam" value={st.data.ringkas_24j.lambat} icon={Clock} />
              <KpiCard label="Database" value={st.data.db.ok ? `${st.data.db.latency_ms} ms` : "Gangguan"} icon={Database}
                hint={st.data.db.migrasi_terakhir ? `Migrasi terakhir: ${st.data.db.migrasi_terakhir}` : undefined} />
              <KpiCard label="Uptime server" value={lama(st.data.uptime_s)} icon={Server} hint={`Memori ${st.data.memori_mb} MB · Node ${st.data.node}`} />
            </div>
            <GrafikPerJam data={st.data.per_jam} />
          </>
        )}

        <section aria-labelledby="judul-log" className="flex flex-col gap-4">
          <h2 id="judul-log" className="font-display text-lg font-semibold">Log</h2>
          <Suspense><FilterLogServer /></Suspense>
          {!log.ok || !log.data ? (
            <GagalMuat judul="Log belum bisa dimuat" isi="Terjadi kesalahan saat mengambil log. Coba lagi." />
          ) : log.data.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-ink-muted">Tidak ada log yang cocok.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-line bg-surface">
                <table className="w-full min-w-[56rem] text-left text-sm">
                  <thead className="bg-subtle text-ink-muted">
                    <tr>{["Waktu (WIB)", "Jenis", "Status", "Request", "Durasi", "Pesan", "Request ID"].map((h) => <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {log.data.map((r) => (
                      <tr key={r.id} className="border-t border-line align-top">
                        <td className="whitespace-nowrap px-3 py-2">{formatTanggal(r.created_at)}, {formatJam(r.created_at)}</td>
                        <td className="px-3 py-2"><Level l={r.level} /></td>
                        <td className={cx("px-3 py-2 font-mono font-semibold", r.status >= 500 && "text-danger")}>{r.status}</td>
                        <td className="px-3 py-2 font-mono"><span className="text-ink-muted">{r.method}</span> {r.path}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono">{r.duration_ms} ms</td>
                        <td className="max-w-72 min-w-48 px-3 py-2 break-words">{r.message ?? "-"}</td>
                        <td className="min-w-52 px-3 py-2 font-mono text-xs break-all text-ink-muted">{r.request_id ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={total} limit={LIMIT_LOG_SERVER} hrefFor={hrefFor} />
            </>
          )}
        </section>
      </div>
    </PageHeader>
  );
}
