import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Pratinjau tautan (WhatsApp, X, Facebook, LinkedIn). Dibuat sekali saat build; font Plus Jakarta Sans (OFL) dari assets/fonts.
export const alt = "KateringKita — kelola pesanan katering kampus tanpa porsi tersisa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Bentuk sama dengan LogoMark (app/components/shell/Brand.tsx), diisi putih.
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M9.4 3.9c-.55.75-.55 1.5 0 2.25M12 3.4c-.6.8-.6 1.6 0 2.4M14.6 3.9c-.55.75-.55 1.5 0 2.25" stroke="#fff" stroke-opacity=".75" stroke-width="1.2" stroke-linecap="round"/><circle cx="12" cy="8.9" r="1.25" fill="#fff"/><path d="M5.4 17.2a6.6 6.6 0 0 1 13.2 0z" fill="#fff"/><rect x="4" y="18.4" width="16" height="2" rx="1" fill="#fff"/></svg>`;
const ORANYE = "#C2410C", INK = "#262017", MUTED = "#665D55", GARIS = "#E8E5DF";

export default async function Image() {
  const [tebal, sedang] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/PlusJakartaSans-ExtraBold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/PlusJakartaSans-Medium.ttf")),
  ]);
  const baris = { display: "flex", justifyContent: "space-between" } as const;
  const garis = { display: "flex", height: 2, background: GARIS, margin: "18px 0" } as const;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: "64px 72px", background: "#F9F8F6", backgroundImage: "radial-gradient(circle at 100% 0%, #FFE2D3 0%, #F9F8F6 62%)", fontFamily: "Jakarta", color: INK }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 650 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", width: 76, height: 76, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundImage: "linear-gradient(135deg, #FF6B35, #FF8243)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- elemen Satori, bukan DOM */}
              <img src={`data:image/svg+xml;base64,${Buffer.from(LOGO).toString("base64")}`} width={54} height={54} alt="" />
            </div>
            <div style={{ display: "flex", marginLeft: 18, fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>
              Katering<span style={{ color: ORANYE }}>Kita</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 70, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2.5 }}>
            {/* tanpa koma/titik: Satori memberi celah sebelum tanda baca pada bobot 800 */}
            <span>Kelola pesanan</span>
            <span>katering kampus</span>
            <span style={{ color: ORANYE }}>tanpa porsi tersisa</span>
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 500, color: MUTED }}>Pre-order untuk penjual katering di sekitar kampus</div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 370, padding: "30px 30px 34px", background: "#FFFDF8", borderRadius: 18, border: `2px solid ${GARIS}`, boxShadow: "0 30px 60px -20px rgba(38,32,23,.35)", transform: "rotate(3deg)", fontSize: 22, fontWeight: 500 }}>
            <div style={{ ...baris, fontWeight: 800 }}><span>KK-4K0T</span><span>07.42</span></div>
            <div style={garis} />
            <div style={baris}><span>2× Nasi Ayam Bakar</span><span>30.000</span></div>
            <div style={{ ...baris, marginTop: 8 }}><span>2× Es Teh</span><span>8.000</span></div>
            <div style={garis} />
            <div style={{ ...baris, fontSize: 26, fontWeight: 800 }}><span>TOTAL</span><span>Rp38.000</span></div>
            <div style={{ display: "flex", marginTop: 18, color: MUTED }}>Ambil: Gedung C, 12.10</div>
            <div style={{ display: "flex", alignSelf: "flex-start", marginTop: 22, padding: "6px 14px", border: `3px solid ${ORANYE}`, borderRadius: 8, color: ORANYE, fontSize: 20, fontWeight: 800, transform: "rotate(-4deg)" }}>
              PORSI DIKUNCI 5:00
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Jakarta", data: tebal, weight: 800, style: "normal" }, { name: "Jakarta", data: sedang, weight: 500, style: "normal" }] },
  );
}
