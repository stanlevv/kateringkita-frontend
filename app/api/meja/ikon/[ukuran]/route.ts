// Route handler GET /api/meja/ikon/[ukuran]: ikon aplikasi pesan dari meja (PNG 192 atau 512 px) yang dipasang ke
// layar utama HP (dirujuk app/manifest.ts). Ikon digambar dari kode dengan ImageResponse (pembuat gambar milik Next),
// tidak bergantung berkas gambar. Latar penuh tanpa sudut transparan sehingga aman sebagai ikon maskable Android
// (ikon yang dipotong bentuknya oleh launcher).
// Route handler adalah file route.ts yang menjawab permintaan HTTP langsung, bukan menampilkan halaman.
import { createElement } from "react";
import { ImageResponse } from "next/og";

/**
 * Menggambar ikon huruf "K" di atas latar oranye.
 * @param _request permintaan masuk (tidak dipakai)
 * @param context parameter route; `ukuran` dari URL ("512" atau lainnya = 192)
 * @returns gambar PNG persegi, boleh disimpan cache seminggu
 */
export async function GET(_request: Request, { params }: { params: Promise<{ ukuran: string }> }) {
  // 1. Ukuran hanya 512 atau 192 px.
  const size = (await params).ukuran === "512" ? 512 : 192;
  // 2. Gambar elemen div berisi huruf K menjadi PNG.
  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF6B35, #FF8243)",
          color: "#262017",
          fontSize: size * 0.5,
          fontWeight: 800,
        },
      },
      "K",
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=604800, immutable" } },
  );
}
