import { createElement } from "react";
import { ImageResponse } from "next/og";

// F21: ikon PWA pesan dari meja (PNG 192/512 px) dibuat dari kode, tidak bergantung berkas gambar.
// Latar penuh tanpa sudut transparan sehingga aman sebagai ikon maskable Android.
export async function GET(_req: Request, { params }: { params: Promise<{ ukuran: string }> }) {
  const n = (await params).ukuran === "512" ? 512 : 192;
  return new ImageResponse(
    createElement("div", {
      style: {
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #FF6B35, #FF8243)", color: "#262017", fontSize: n * 0.5, fontWeight: 800,
      },
    }, "K"),
    { width: n, height: n, headers: { "Cache-Control": "public, max-age=604800, immutable" } },
  );
}
