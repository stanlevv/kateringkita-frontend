// Penjaga struktur fe/: aturan letak berkas dan jalur impor.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const AKAR = resolve(__dirname, "..");
const ABAIKAN = new Set(["node_modules", ".next"]);

export function semuaBerkas(dir: string = AKAR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (ABAIKAN.has(e.name)) return [];
    const p = join(dir, e.name);
    if (e.isDirectory()) return semuaBerkas(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

/** String jalur dari `import … from "…"`, `export … from "…"`, dan `vi.mock("…")`. */
export function imporDari(berkas: string): string[] {
  const teks = readFileSync(berkas, "utf8");
  const pola = /(?:\bfrom\s+|\bvi\.mock\(\s*)["']([^"']+)["']/g;
  return [...teks.matchAll(pola)].map((m) => m[1]);
}

const relatif = (p: string) => relative(AKAR, p).split(sep).join("/");

describe("struktur: tipe per domain", () => {
  it("tidak ada lib/types.ts dan lib/admin/types.ts", () => {
    expect(existsSync(join(AKAR, "lib/types.ts"))).toBe(false);
    expect(existsSync(join(AKAR, "lib/admin/types.ts"))).toBe(false);
  });

  it("tidak ada impor @/lib/types atau @/lib/admin/types (juga bentuk relatifnya)", () => {
    const lama = (p: string) => p === "@/lib/types" || p === "@/lib/admin/types" || /^(\.\.?\/)+types$/.test(p);
    const pelanggar = semuaBerkas()
      .filter((b) => !relatif(b).startsWith("types/") && relatif(b) !== "test/struktur.test.ts")
      .filter((b) => imporDari(b).some(lama))
      .map(relatif);
    expect(pelanggar).toEqual([]);
  });
});

describe("struktur: pemanggil API di services/", () => {
  const LAMA = ["lib/api.ts", "lib/merchant-api.ts", "lib/session.ts", "lib/data", "lib/admin"];

  it("jalur lama sudah tidak ada", () => {
    expect(LAMA.filter((p) => existsSync(join(AKAR, p)))).toEqual([]);
  });

  it("tidak ada impor ke jalur lama", () => {
    const lama = (p: string) => /^@\/lib\/(api|merchant-api|session|data|admin)(\/|$)/.test(p);
    const pelanggar = semuaBerkas()
      .filter((b) => relatif(b) !== "test/struktur.test.ts")
      .filter((b) => imporDari(b).some(lama))
      .map(relatif);
    expect(pelanggar).toEqual([]);
  });

  it("berkas services/ selain api.ts bernama <x>Service.ts", () => {
    const salah = (existsSync(join(AKAR, "services")) ? semuaBerkas(join(AKAR, "services")) : [])
      .map(relatif)
      .filter((b) => !/\.test\.tsx?$/.test(b) && b !== "services/api.ts" && !/^services\/[a-z]+Service\.ts$/i.test(b));
    expect(salah).toEqual([]);
  });
});

describe("struktur: custom hook di hooks/", () => {
  it("penjaga memindai berkas (bukan lolos kosong)", () => {
    expect(semuaBerkas().length).toBeGreaterThan(50);
  });

  it("tidak ada berkas use[A-Z]*.ts(x) di luar hooks/", () => {
    const salah = semuaBerkas()
      .map(relatif)
      .filter((b) => /(^|\/)use[A-Z][^/]*\.tsx?$/.test(b) && !/\.test\.tsx?$/.test(b) && !b.startsWith("hooks/"));
    expect(salah).toEqual([]);
  });
});

describe("struktur: komponen bersama di app/components/", () => {
  const LAMA = [
    "components/ui",
    "components/shell",
    "components/landing",
    "components/promo",
    "components/dashboard/GagalMuat.tsx",
    "components/dashboard/GagalMuat.test.tsx",
    "components/dashboard/StatusToko.tsx",
    "components/dashboard/StatusToko.test.tsx",
  ];

  it("jalur lama sudah tidak ada", () => {
    expect(LAMA.filter((p) => existsSync(join(AKAR, p)))).toEqual([]);
  });

  it("ada app/components/{ui,shell,landing,promo}", () => {
    const hilang = ["ui", "shell", "landing", "promo"].filter((d) => !existsSync(join(AKAR, "app/components", d)));
    expect(hilang).toEqual([]);
  });

  it("tidak ada impor ke jalur lama", () => {
    const lama = (p: string) =>
      /^@\/components\/(ui|shell|landing|promo)(\/|$)/.test(p) || /^@\/components\/dashboard\/(GagalMuat|StatusToko)$/.test(p);
    const pelanggar = semuaBerkas()
      .filter((b) => relatif(b) !== "test/struktur.test.ts")
      .filter((b) => imporDari(b).some(lama))
      .map(relatif);
    expect(pelanggar).toEqual([]);
  });
});

describe("struktur: komponen khusus halaman di app/(grup)/<halaman>/components/", () => {
  const POLA = /^app\/\(([^)/]+)\)\/([^/]+)\/components\//;

  /** Jalur impor → jalur relatif terhadap fe/ tanpa ekstensi; null bila paket luar. */
  const selesaikan = (dari: string, p: string): string | null => {
    if (p.startsWith("@/")) return p.slice(2);
    if (p.startsWith(".")) return relatif(resolve(dirname(dari), p));
    return null;
  };

  it("fe/components/ tidak ada", () => {
    expect(existsSync(join(AKAR, "components"))).toBe(false);
  });

  it("penjaga menemukan folder components halaman (bukan lolos kosong)", () => {
    expect(semuaBerkas().map(relatif).filter((b) => POLA.test(b)).length).toBeGreaterThan(50);
  });

  it("berkas di components/ halaman hanya diimpor dari folder halaman pemiliknya", () => {
    const pelanggar: string[] = [];
    for (const b of semuaBerkas()) {
      for (const p of imporDari(b)) {
        const tujuan = selesaikan(b, p);
        const m = tujuan && POLA.exec(tujuan);
        if (!m) continue;
        const pemilik = `app/(${m[1]})/${m[2]}/`;
        if (!relatif(b).startsWith(pemilik)) pelanggar.push(`${relatif(b)} -> ${p}`);
      }
    }
    expect(pelanggar).toEqual([]);
  });
});

describe("struktur: Route Handler di app/api/", () => {
  const berkas = () => semuaBerkas().map(relatif);

  it("route.ts dan route.test.ts hanya di bawah app/api/; ketiga handler ada", () => {
    const route = berkas().filter((b) => /(^|\/)route(\.test)?\.tsx?$/.test(b));
    expect(route.filter((b) => !b.startsWith("app/api/"))).toEqual([]);
    for (const r of ["app/api/dashboard/sinkron/route.ts", "app/api/laporan/csv/route.ts", "app/api/pesanan/[code]/wa/route.ts"]) {
      expect(route).toContain(r);
    }
  });

  it('tidak ada alamat lama "/dashboard/sinkron", "/laporan/csv", `/pesanan/${…}/wa` di kode', () => {
    const lama = [/(?<!\/api)\/dashboard\/sinkron/, /(?<!\/api)\/laporan\/csv/, /(?<!\/api)\/pesanan\/(?:\$\{[^}]*\}|[^/\s"'`]+)\/wa\b/];
    const pelanggar = berkas()
      .filter((b) => b !== "test/struktur.test.ts")
      .filter((b) => lama.some((p) => p.test(readFileSync(join(AKAR, b), "utf8"))));
    expect(pelanggar).toEqual([]);
  });
});

describe("struktur: tema di styles/", () => {
  it("styles/kk-theme.css berisi @theme; globals.css mengimpornya dan tidak punya blok @theme", () => {
    const tema = join(AKAR, "styles/kk-theme.css");
    expect(existsSync(tema)).toBe(true);
    expect(readFileSync(tema, "utf8")).toContain("@theme");
    const globals = readFileSync(join(AKAR, "app/globals.css"), "utf8");
    expect(globals).toContain('@import "../styles/kk-theme.css";');
    expect(globals).not.toContain("@theme");
  });
});
