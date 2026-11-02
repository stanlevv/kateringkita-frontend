import { requestUpload } from "@/app/actions/menus";
import { panggil } from "./aksi";
import type { ActionResult } from "./types";

/** Browser -> penyimpanan: minta URL bertanda tangan ke server, lalu PUT berkas langsung (FE-08). */
export async function unggahFoto(file: File, purpose: "menu" | "logo" | "qris"): Promise<ActionResult<{ public_url: string }>> {
  const r = await panggil(() => requestUpload({ purpose, content_type: file.type, size: file.size }));
  if ("error" in r) return r;
  try {
    // Content-Type dan Content-Length ikut ditandatangani (be/src/upload/r2.ts): berkas tidak boleh diubah ukuran/dikompres
    // antara minta URL dan PUT, kalau tidak penyimpanan menolaknya. Browser mengisi Content-Length dari body.
    const res = await fetch(r.data.upload_url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (res.ok) return { data: { public_url: r.data.public_url } };
  } catch {
    // jatuh ke galat di bawah
  }
  return { error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } };
}
