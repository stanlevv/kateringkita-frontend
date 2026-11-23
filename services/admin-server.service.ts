import "server-only";
import { adminFetch, toResult } from "@/services/api";
import type { ServerLog, ServerStatus } from "@/types/server";

// F23 dashboard server
export const LIMIT_SERVER_LOGS = 20;

export const getServerStatus = async () => toResult(await adminFetch<ServerStatus>("/server-status"));

export const getServerLogs = (query: URLSearchParams) => adminFetch<ServerLog[]>(`/server-logs?${query}`);
