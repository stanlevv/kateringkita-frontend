// Halaman /admin/server: status server dan log request bermasalah. Bagian atas menampilkan kondisi backend (jumlah
// error 5xx dan request lambat 24 jam terakhir, koneksi database, lama server menyala), lalu grafik masalah per jam.
// Bagian bawah berisi log: setiap error 5xx (galat di sisi server) dan request lambat (lebih dari 2 detik) dicatat
// backend dan disimpan 30 hari. Server component: membaca searchParams (?level=&q=&page=), mengambil data lewat
// services/admin-server.service.ts (GET /admin/server-status dan /admin/server-logs). Hanya admin super.
import { Suspense } from "react";
import { CircleX, Clock, Database, Server } from "lucide-react";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { KpiCard } from "@/app/components/ui/KpiCard";
import { Pagination } from "@/app/components/ui/Pagination";
import { cx } from "@/app/components/ui/cx";
import { formatTime, formatDate } from "@/lib/format";
import { getServerLogs, getServerStatus, LIMIT_SERVER_LOGS } from "@/services/admin-server.service";
import { requireAdmin } from "@/services/auth.service";
import type { ServerLog } from "@/types/server";
import { ServerLogFilters } from "./components/ServerLogFilters";
import { HourlyIssuesChart } from "./components/HourlyIssuesChart";

// Lama server menyala dari detik menjadi "1 hr 1 j 1 mnt"; hari dan jam yang nol tidak ditulis.
const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400),
    hours = Math.floor((seconds % 86400) / 3600),
    minutes = Math.floor((seconds % 3600) / 60);
  return [days && `${days} hr`, hours && `${hours} j`, `${minutes} mnt`].filter(Boolean).join(" ");
};

/**
 * Label jenis log: Error (merah) atau Lambat (kuning).
 * @param props.level jenis log dari backend ("error" atau "slow")
 * @returns span berwarna dengan ikon
 */
function LevelBadge({ level }: { level: ServerLog["level"] }) {
  return level === "error" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger">
      <CircleX aria-hidden className="size-3.5" />
      Error
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
      <Clock aria-hidden className="size-3.5" />
      Lambat
    </span>
  );
}

/**
 * Halaman server: kondisi server, masalah per jam, dan log error 5xx & request lambat (30 hari). Status dan log dimuat
 * bersamaan; bila salah satu gagal, bagian lain tetap tampil.
 * @param props.searchParams parameter URL: `level` ("error" atau "slow"), `q` (request ID atau path), `page`
 * @returns PageHeader berisi KPI, grafik per jam, penyaring, dan tabel log
 */
export default async function ServerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // 1. Hanya admin super; baca parameter URL.
  await requireAdmin("super");
  const params = await searchParams;
  // 2. Saring nilai URL: level selain error/slow dibuang, kata cari dipotong 128 karakter.
  const apiQuery = new URLSearchParams();
  if (params.level === "error" || params.level === "slow") apiQuery.set("level", params.level);
  if (params.q) apiQuery.set("q", params.q.slice(0, 128));
  // 3. Nomor halaman harus bilangan bulat 1–100.000; selain itu dianggap halaman 1.
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  // 4. Tautan paginasi membawa penyaring yang sama (dibuat sebelum page/limit ditambahkan ke query).
  const hrefFor = (pageNumber: number) =>
    `/admin/server?${new URLSearchParams({ ...Object.fromEntries(apiQuery), page: String(pageNumber) })}`;
  apiQuery.set("page", String(page));
  apiQuery.set("limit", String(LIMIT_SERVER_LOGS));
  // 5. Ambil status dan satu halaman log bersamaan; total untuk paginasi ada di `meta`.
  const [status, log] = await Promise.all([getServerStatus(), getServerLogs(apiQuery)]);
  const total = (log.meta as { total?: number } | undefined)?.total ?? log.data?.length ?? 0;

  return (
    <PageHeader title="Server" description="Kondisi backend, error 5xx, dan request lambat. Log disimpan 30 hari.">
      <div className="flex flex-col gap-6">
        {"error" in status ? (
          <LoadError title="Status server belum bisa dimuat" body="Backend tidak menjawab. Coba lagi sebentar lagi." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Error 5xx · 24 jam" value={status.data.ringkas_24j.error} icon={CircleX} />
              <KpiCard label="Lambat > 2 dtk · 24 jam" value={status.data.ringkas_24j.lambat} icon={Clock} />
              <KpiCard
                label="Database"
                value={status.data.db.ok ? `${status.data.db.latency_ms} ms` : "Gangguan"}
                icon={Database}
                hint={
                  status.data.db.migrasi_terakhir ? `Migrasi terakhir: ${status.data.db.migrasi_terakhir}` : undefined
                }
              />
              <KpiCard
                label="Uptime server"
                value={formatUptime(status.data.uptime_s)}
                icon={Server}
                hint={`Memori ${status.data.memori_mb} MB · Node ${status.data.node}`}
              />
            </div>
            <HourlyIssuesChart data={status.data.per_jam} />
          </>
        )}

        <section aria-labelledby="judul-log" className="flex flex-col gap-4">
          <h2 id="judul-log" className="font-display text-lg font-semibold">
            Log
          </h2>
          <Suspense>
            <ServerLogFilters />
          </Suspense>
          {!log.ok || !log.data ? (
            <LoadError title="Log belum bisa dimuat" body="Terjadi kesalahan saat mengambil log. Coba lagi." />
          ) : log.data.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-ink-muted">
              Tidak ada log yang cocok.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-line bg-surface">
                <table className="w-full min-w-[56rem] text-left text-sm">
                  <thead className="bg-subtle text-ink-muted">
                    <tr>
                      {["Waktu (WIB)", "Jenis", "Status", "Request", "Durasi", "Pesan", "Request ID"].map((header) => (
                        <th key={header} scope="col" className="px-3 py-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {log.data.map((row) => (
                      <tr key={row.id} className="border-t border-line align-top">
                        <td className="whitespace-nowrap px-3 py-2">
                          {formatDate(row.created_at)}, {formatTime(row.created_at)}
                        </td>
                        <td className="px-3 py-2">
                          <LevelBadge level={row.level} />
                        </td>
                        <td className={cx("px-3 py-2 font-mono font-semibold", row.status >= 500 && "text-danger")}>
                          {row.status}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          <span className="text-ink-muted">{row.method}</span> {row.path}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono">{row.duration_ms} ms</td>
                        <td className="max-w-72 min-w-48 px-3 py-2 break-words">{row.message ?? "-"}</td>
                        <td className="min-w-52 px-3 py-2 font-mono text-xs break-all text-ink-muted">
                          {row.request_id ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={total} limit={LIMIT_SERVER_LOGS} hrefFor={hrefFor} />
            </>
          )}
        </section>
      </div>
    </PageHeader>
  );
}
