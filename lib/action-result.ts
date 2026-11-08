import type { ApiError } from "@/types/api";

export const galat = (code: string, message: string): { error: ApiError } => ({ error: { code, message } });

/** Galat per field (satu pesan per field) dalam bentuk error API (§1). */
export const galatField = (map: Record<string, string>, message: string): { error: ApiError } => ({
  error: { code: "VALIDATION_ERROR", message, fields: Object.fromEntries(Object.entries(map).map(([k, m]) => [k, [m]])) },
});
