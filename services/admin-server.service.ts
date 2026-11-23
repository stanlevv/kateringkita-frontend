import "server-only";
import { adminFetch, hasil } from "@/services/api";
import type { LogServer, StatusServer } from "@/types/server";

// F23 dashboard server
export const LIMIT_LOG_SERVER = 20;

export const getStatusServer = async () => hasil(await adminFetch<StatusServer>("/server-status"));

export const getLogServer = (q: URLSearchParams) => adminFetch<LogServer[]>(`/server-logs?${q}`);
