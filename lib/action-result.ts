import type { ApiError } from "@/types/api";

export const errorResult = (code: string, message: string): { error: ApiError } => ({ error: { code, message } });

/** Galat per field (satu pesan per field) dalam bentuk error API (§1). */
export const fieldErrorResult = (map: Record<string, string>, message: string): { error: ApiError } => ({
  error: {
    code: "VALIDATION_ERROR",
    message,
    fields: Object.fromEntries(Object.entries(map).map(([field, fieldMessage]) => [field, [fieldMessage]])),
  },
});
