// Penjaga kerangka memuat (SY-3): tiap halaman punya loading.tsx sendiri, dan judul/deskripsi statisnya sama persis
// dengan PageHeader halamannya, supaya saat data datang hanya isi yang berganti (tanpa lompatan).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const AKAR = resolve(__dirname, "..");
// Alat dev; cukup kerangka netral app/(dashboard)/loading.tsx.
const KECUALI = new Set(["app/(dashboard)/pratinjau"]);

const relatif = (p: string) => relative(AKAR, p).split(sep).join("/");
const baca = (p: string) => readFileSync(p, "utf8");
const cari = (dir: string, nama: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? cari(join(dir, e.name), nama) : e.name === nama ? [join(dir, e.name)] : []));

/** page.tsx + komponen milik halaman itu (judul dashboard ada di components/DashboardLive.tsx). */
function sumber(folder: string): string {
  const k = join(folder, "components");
  const komponen = existsSync(k) ? readdirSync(k).filter((n) => n.endsWith(".tsx") && !n.includes(".test.")).map((n) => baca(join(k, n))) : [];
  return [baca(join(folder, "page.tsx")), ...komponen].join("\n");
}

describe("kerangka memuat", () => {
  const halaman = ["app/(dashboard)", "app/(admin)"].flatMap((g) => cari(join(AKAR, g), "page.tsx")).map(dirname);

  it("penjaga menemukan halaman (bukan lolos kosong)", () => {
    expect(halaman.length).toBeGreaterThan(20);
  });

  it("tiap halaman punya loading.tsx sendiri (bukan kerangka halaman lain)", () => {
    expect(halaman.filter((d) => !KECUALI.has(relatif(d)) && !existsSync(join(d, "loading.tsx"))).map(relatif)).toEqual([]);
  });

  it("judul & deskripsi kerangka = PageHeader halaman", () => {
    const beda: string[] = [];
    for (const d of halaman) {
      const berkas = join(d, "loading.tsx");
      if (!existsSync(berkas)) continue;
      const kerangka = baca(berkas);
      const judul = /\bjudul="([^"]+)"/.exec(kerangka)?.[1];
      if (!judul) continue; // judul dari data (kode pesanan, nama toko) ikut dikerangkakan
      const header = [...sumber(d).matchAll(/<PageHeader\s+title="([^"]+)"(?:\s+description="([^"]+)")?/g)].filter((m) => m[1] === judul);
      const deskripsi = /\bdeskripsi="([^"]+)"/.exec(kerangka)?.[1];
      const harus = header.map((m) => m[2]).find(Boolean);
      if (header.length === 0) beda.push(`${relatif(berkas)}: tidak ada <PageHeader title="${judul}">`);
      else if (deskripsi !== harus) beda.push(`${relatif(berkas)}: deskripsi "${deskripsi ?? ""}", halaman "${harus ?? ""}"`);
    }
    expect(beda).toEqual([]);
  });
});
