// F23 dashboard server (kontrak backend: /admin/server-status, /admin/server-logs)
export type LevelLog = "error" | "slow";

export type LogServer = {
  id: number;
  request_id: string | null;
  level: LevelLog;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  message: string | null;
  user_id: number | null;
  created_at: string;
};

export type JamServer = { jam: string; error: number; lambat: number };

export type StatusServer = {
  uptime_s: number;
  memori_mb: number;
  node: string;
  db: { ok: boolean; latency_ms: number; migrasi_terakhir: string | null };
  ringkas_24j: { error: number; lambat: number };
  per_jam: JamServer[];
};
