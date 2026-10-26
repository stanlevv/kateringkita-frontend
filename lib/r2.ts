import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Konfigurasi Cloudflare R2 (S3-Compatible API)
 * Dokumentasi endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 */

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}

let s3ClientInstance: S3Client | null = null;

function getR2Client(): S3Client {
  if (!s3ClientInstance) {
    const accountId = process.env.R2_ACCOUNT_ID || "";
    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3ClientInstance;
}

export type UploadResult = {
  success: boolean;
  url: string;
  source: "r2" | "fallback";
  message?: string;
};

/**
 * Mengunggah file gambar ke Cloudflare R2 dengan graceful fallback.
 * @param file Objek File gambar dari form input
 * @returns UploadResult berisi URL publik gambar
 */
export async function uploadImageToR2(file: File): Promise<UploadResult> {
  // 1. Validasi tipe file
  const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (!allowedMime.includes(file.type)) {
    throw new Error("Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WebP.");
  }

  // 2. Batas ukuran 5 MB
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Ukuran gambar maksimal 5 MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Buat nama file unik
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const key = `menu-${uniqueId}.${ext}`;

  // 3. Jika kredensial R2 lengkap, unggah ke Cloudflare R2
  if (isR2Configured()) {
    try {
      const client = getR2Client();
      const bucket = process.env.R2_BUCKET_NAME!;
      const publicBaseUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      });

      await client.send(command);

      const publicUrl = `${publicBaseUrl}/${key}`;
      return {
        success: true,
        url: publicUrl,
        source: "r2",
        message: "Foto berhasil diunggah ke Cloudflare R2.",
      };
    } catch (err: any) {
      console.error("[Cloudflare R2 Error]:", err);
      throw new Error(`Gagal mengunggah ke Cloudflare R2: ${err.message || "Unknown error"}`);
    }
  }

  // 4. Graceful Fallback Mode jika R2 belum dikonfigurasi di .env.local
  console.warn(
    "[Cloudflare R2]: Kredensial R2 belum terisi lengkap di .env.local. Beralih ke local base64 fallback mode."
  );

  const base64Data = buffer.toString("base64");
  const fallbackDataUrl = `data:${file.type};base64,${base64Data}`;

  return {
    success: true,
    url: fallbackDataUrl,
    source: "fallback",
    message: "Foto diproses dalam local fallback mode (Kredensial Cloudflare R2 belum diset).",
  };
}
