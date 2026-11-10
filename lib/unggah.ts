import { requestUpload } from "@/app/actions/menus";
import { panggil } from "./aksi";
import type { ActionResult } from "@/types/api";

type Tujuan = "menu" | "logo";

const MAKS_UNGGAH = 5 * 1024 * 1024; // sama dengan uploadSchema backend

// Foto menu tampil paling lebar selebar layar HP; logo paling besar 160 px. Logo boleh transparan, foto menu diberi latar putih.
const ATURAN: Record<Tujuan, { sisi: number; latar: string | null; cadangan: "image/jpeg" | "image/png" }> = {
  menu: { sisi: 1600, latar: "#fff", cadangan: "image/jpeg" },
  logo: { sisi: 512, latar: null, cadangan: "image/png" },
};

const keBlob = (c: HTMLCanvasElement, type: string, mutu: number) => new Promise<Blob | null>((r) => c.toBlob(r, type, mutu));

/**
 * Perkecil dan sandikan ulang foto di browser. Semua <Image> memakai `unoptimized`, jadi pembeli mengunduh berkas ini
 * apa adanya; sandi ulang juga membuang EXIF (termasuk lokasi GPS) karena bucket R2 publik.
 * Bila browser gagal membaca atau menyandikan, berkas asli dipakai.
 */
export async function kecilkanFoto(file: File, tujuan: Tujuan): Promise<Blob> {
  const { sisi, latar, cadangan } = ATURAN[tujuan];
  let src: string | undefined;
  try {
    src = URL.createObjectURL(file);
    const img = new Image();
    img.src = src;
    await img.decode();
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return file;
    const skala = Math.min(1, sisi / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * skala));
    c.height = Math.max(1, Math.round(h * skala));
    const ctx = c.getContext("2d");
    if (!ctx) return file;
    if (latar) {
      ctx.fillStyle = latar;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    let hasil = await keBlob(c, "image/webp", 0.82);
    // Browser tanpa penyandi WebP (Safari) memberi PNG: pakai JPEG untuk foto, PNG untuk logo
    if (hasil?.type !== "image/webp") hasil = await keBlob(c, cadangan, 0.85);
    return hasil && (hasil.type === "image/webp" || hasil.type === cadangan) ? hasil : file;
  } catch {
    return file;
  } finally {
    if (src) URL.revokeObjectURL(src);
  }
}

/** Browser -> penyimpanan: perkecil foto, minta URL bertanda tangan ke server, lalu PUT berkas langsung (FE-08). */
export async function unggahFoto(file: File, purpose: Tujuan): Promise<ActionResult<{ public_url: string }>> {
  const berkas = await kecilkanFoto(file, purpose);
  // Hanya terjadi bila browser gagal memperkecil berkas asli yang besar
  if (berkas.size > MAKS_UNGGAH) return { error: { code: "VALIDATION_ERROR", message: "Ukuran foto maksimal 5 MB." } };
  const r = await panggil(() => requestUpload({ purpose, content_type: berkas.type, size: berkas.size }));
  if ("error" in r) return r;
  try {
    // Content-Type dan Content-Length ikut ditandatangani (be/src/upload/r2.ts): berkas tidak boleh diubah ukuran/dikompres
    // antara minta URL dan PUT, kalau tidak penyimpanan menolaknya. Browser mengisi Content-Length dari body.
    const res = await fetch(r.data.upload_url, { method: "PUT", headers: { "Content-Type": berkas.type }, body: berkas });
    if (res.ok) return { data: { public_url: r.data.public_url } };
  } catch {
    // jatuh ke galat di bawah
  }
  return { error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } };
}
