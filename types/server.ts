// Bentuk data dashboard server untuk admin (GET /admin/server-status dan /admin/server-logs).
// Nama properti mengikuti JSON backend, sebagian memang berbahasa Indonesia.

/** Jenis catatan server: galat (error) atau permintaan lambat (slow). */
export type LogLevel = "error" | "slow";

/** Satu catatan permintaan yang galat atau lambat. */
export type ServerLog = {
  id: number;
  request_id: string | null;
  level: LogLevel;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  message: string | null;
  user_id: number | null;
  created_at: string;
};

/** Jumlah galat dan permintaan lambat pada satu jam. */
export type HourlyServerStats = { jam: string; error: number; lambat: number };

/** Kesehatan server: lama menyala, memori, versi Node, koneksi database, dan ringkasan 24 jam terakhir. */
export type ServerStatus = {
  uptime_s: number;
  memori_mb: number;
  node: string;
  db: { ok: boolean; latency_ms: number; migrasi_terakhir: string | null };
  ringkas_24j: { error: number; lambat: number };
  per_jam: HourlyServerStats[];
};
