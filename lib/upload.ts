import { requestUpload } from "@/app/actions/menus";
import { callAction } from "./action";
import type { ActionResult } from "@/types/api";

type UploadPurpose = "menu" | "logo" | "banner" | "popup" | "cover";
type RequestUploadFn = (body: {
  purpose: UploadPurpose;
  content_type: string;
  size: number;
}) => Promise<ActionResult<{ upload_url: string; public_url: string; expires_at: string }>>;

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // sama dengan uploadSchema backend

// Foto menu tampil paling lebar selebar layar HP; logo paling besar 160 px. Logo boleh transparan, foto menu diberi latar putih.
const RESIZE_RULES: Record<
  UploadPurpose,
  { maxSide: number; background: string | null; fallbackType: "image/jpeg" | "image/png" }
> = {
  menu: { maxSide: 1600, background: "#fff", fallbackType: "image/jpeg" },
  logo: { maxSide: 512, background: null, fallbackType: "image/png" },
  // banner beranda 2:1 & pop-up 3:4 tampil selebar layar HP
  banner: { maxSide: 1600, background: "#fff", fallbackType: "image/jpeg" },
  popup: { maxSide: 1200, background: "#fff", fallbackType: "image/jpeg" },
  // background profil toko: lebar penuh layar HP
  cover: { maxSide: 1600, background: "#fff", fallbackType: "image/jpeg" },
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Perkecil dan sandikan ulang foto di browser. Semua <Image> memakai `unoptimized`, jadi pembeli mengunduh berkas ini
 * apa adanya; sandi ulang juga membuang EXIF (termasuk lokasi GPS) karena bucket R2 publik.
 * Bila browser gagal membaca atau menyandikan, berkas asli dipakai.
 */
export async function resizePhoto(file: File, purpose: UploadPurpose): Promise<Blob> {
  const { maxSide, background, fallbackType } = RESIZE_RULES[purpose];
  let objectUrl: string | undefined;
  try {
    objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const { naturalWidth: width, naturalHeight: height } = image;
    if (!width || !height) return file;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let blob = await canvasToBlob(canvas, "image/webp", 0.82);
    // Browser tanpa penyandi WebP (Safari) memberi PNG: pakai JPEG untuk foto, PNG untuk logo
    if (blob?.type !== "image/webp") blob = await canvasToBlob(canvas, fallbackType, 0.85);
    return blob && (blob.type === "image/webp" || blob.type === fallbackType) ? blob : file;
  } catch {
    return file;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Browser -> penyimpanan: perkecil foto, minta URL bertanda tangan ke server, lalu PUT berkas langsung (FE-08). */
export async function uploadPhoto(
  file: File,
  purpose: UploadPurpose,
  requestUploadUrl?: RequestUploadFn,
): Promise<ActionResult<{ public_url: string }>> {
  const photo = await resizePhoto(file, purpose);
  // Hanya terjadi bila browser gagal memperkecil berkas asli yang besar
  if (photo.size > MAX_UPLOAD_BYTES)
    return { error: { code: "VALIDATION_ERROR", message: "Ukuran foto maksimal 5 MB." } };
  // penjual: POST /merchant/uploads (menu, logo, banner); admin: POST /admin/uploads (banner, popup) lewat `minta`
  const result = await callAction(() =>
    (requestUploadUrl ?? (requestUpload as RequestUploadFn))({ purpose, content_type: photo.type, size: photo.size }),
  );
  if ("error" in result) return result;
  try {
    // Content-Type dan Content-Length ikut ditandatangani (be/src/upload/r2.ts): berkas tidak boleh diubah ukuran/dikompres
    // antara minta URL dan PUT, kalau tidak penyimpanan menolaknya. Browser mengisi Content-Length dari body.
    const response = await fetch(result.data.upload_url, {
      method: "PUT",
      headers: { "Content-Type": photo.type },
      body: photo,
    });
    if (response.ok) return { data: { public_url: result.data.public_url } };
  } catch {
    // jatuh ke galat di bawah
  }
  return { error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } };
}
