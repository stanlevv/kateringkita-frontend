// Penjaga struktur fe/: aturan letak berkas dan jalur impor.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");
const IGNORED_DIRS = new Set(["node_modules", ".next"]);

export function listSourceFiles(dir: string = ROOT): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (IGNORED_DIRS.has(entry.name)) return [];
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(entryPath);
    return /\.tsx?$/.test(entry.name) ? [entryPath] : [];
  });
}

/** String jalur dari `import … from "…"`, `export … from "…"`, dan `vi.mock("…")`. */
export function importPaths(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const pattern = /(?:\bfrom\s+|\bvi\.mock\(\s*)["']([^"']+)["']/g;
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

const toRelative = (filePath: string) => relative(ROOT, filePath).split(sep).join("/");

describe("struktur: tipe per domain", () => {
  it("tidak ada lib/types.ts dan lib/admin/types.ts", () => {
    expect(existsSync(join(ROOT, "lib/types.ts"))).toBe(false);
    expect(existsSync(join(ROOT, "lib/admin/types.ts"))).toBe(false);
  });

  it("tidak ada impor @/lib/types atau @/lib/admin/types (juga bentuk relatifnya)", () => {
    const isOldImport = (importPath: string) =>
      importPath === "@/lib/types" || importPath === "@/lib/admin/types" || /^(\.\.?\/)+types$/.test(importPath);
    const violations = listSourceFiles()
      .filter((file) => !toRelative(file).startsWith("types/") && toRelative(file) !== "test/structure.test.ts")
      .filter((file) => importPaths(file).some(isOldImport))
      .map(toRelative);
    expect(violations).toEqual([]);
  });
});

describe("struktur: pemanggil API di services/", () => {
  const OLD_PATHS = ["lib/api.ts", "lib/merchant-api.ts", "lib/session.ts", "lib/data", "lib/admin"];

  it("jalur lama sudah tidak ada", () => {
    expect(OLD_PATHS.filter((oldPath) => existsSync(join(ROOT, oldPath)))).toEqual([]);
  });

  it("tidak ada impor ke jalur lama", () => {
    const isOldImport = (importPath: string) => /^@\/lib\/(api|merchant-api|session|data|admin)(\/|$)/.test(importPath);
    const violations = listSourceFiles()
      .filter((file) => toRelative(file) !== "test/structure.test.ts")
      .filter((file) => importPaths(file).some(isOldImport))
      .map(toRelative);
    expect(violations).toEqual([]);
  });

  it("berkas services/ selain api.ts bernama <fitur>.service.ts", () => {
    const misplaced = (existsSync(join(ROOT, "services")) ? listSourceFiles(join(ROOT, "services")) : [])
      .map(toRelative)
      .filter(
        (file) =>
          !/\.test\.tsx?$/.test(file) &&
          file !== "services/api.ts" &&
          !/^services\/[a-z]+(-[a-z]+)*\.service\.ts$/.test(file),
      );
    expect(misplaced).toEqual([]);
  });
});

describe("struktur: custom hook di hooks/", () => {
  it("penjaga memindai berkas (bukan lolos kosong)", () => {
    expect(listSourceFiles().length).toBeGreaterThan(50);
  });

  it("tidak ada berkas use[A-Z]*.ts(x) di luar hooks/", () => {
    const misplaced = listSourceFiles()
      .map(toRelative)
      .filter(
        (file) => /(^|\/)use[A-Z][^/]*\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.startsWith("hooks/"),
      );
    expect(misplaced).toEqual([]);
  });
});

describe("struktur: komponen bersama di app/components/", () => {
  const OLD_PATHS = [
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
    expect(OLD_PATHS.filter((oldPath) => existsSync(join(ROOT, oldPath)))).toEqual([]);
  });

  it("ada app/components/{ui,shell,landing,promo}", () => {
    const missing = ["ui", "shell", "landing", "promo"].filter((dir) => !existsSync(join(ROOT, "app/components", dir)));
    expect(missing).toEqual([]);
  });

  it("tidak ada impor ke jalur lama", () => {
    const isOldImport = (importPath: string) =>
      /^@\/components\/(ui|shell|landing|promo)(\/|$)/.test(importPath) ||
      /^@\/components\/dashboard\/(GagalMuat|StatusToko)$/.test(importPath);
    const violations = listSourceFiles()
      .filter((file) => toRelative(file) !== "test/structure.test.ts")
      .filter((file) => importPaths(file).some(isOldImport))
      .map(toRelative);
    expect(violations).toEqual([]);
  });
});

describe("struktur: komponen khusus halaman di app/(grup)/<halaman>/components/", () => {
  const PAGE_COMPONENTS_PATTERN = /^app\/\(([^)/]+)\)\/([^/]+)\/components\//;

  /** Jalur impor → jalur relatif terhadap fe/ tanpa ekstensi; null bila paket luar. */
  const resolveImport = (fromFile: string, importPath: string): string | null => {
    if (importPath.startsWith("@/")) return importPath.slice(2);
    if (importPath.startsWith(".")) return toRelative(resolve(dirname(fromFile), importPath));
    return null;
  };

  it("fe/components/ tidak ada", () => {
    expect(existsSync(join(ROOT, "components"))).toBe(false);
  });

  it("penjaga menemukan folder components halaman (bukan lolos kosong)", () => {
    expect(
      listSourceFiles()
        .map(toRelative)
        .filter((file) => PAGE_COMPONENTS_PATTERN.test(file)).length,
    ).toBeGreaterThan(50);
  });

  it("berkas di components/ halaman hanya diimpor dari folder halaman pemiliknya", () => {
    const violations: string[] = [];
    for (const file of listSourceFiles()) {
      for (const importPath of importPaths(file)) {
        const target = resolveImport(file, importPath);
        const match = target && PAGE_COMPONENTS_PATTERN.exec(target);
        if (!match) continue;
        const owner = `app/(${match[1]})/${match[2]}/`;
        if (!toRelative(file).startsWith(owner)) violations.push(`${toRelative(file)} -> ${importPath}`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe("struktur: Route Handler di app/api/", () => {
  const listFiles = () => listSourceFiles().map(toRelative);

  it("route.ts dan route.test.ts hanya di bawah app/api/; ketiga handler ada", () => {
    const routeFiles = listFiles().filter((file) => /(^|\/)route(\.test)?\.tsx?$/.test(file));
    expect(routeFiles.filter((file) => !file.startsWith("app/api/"))).toEqual([]);
    for (const routePath of [
      "app/api/dashboard/sinkron/route.ts",
      "app/api/laporan/csv/route.ts",
      "app/api/pesanan/[code]/wa/route.ts",
    ]) {
      expect(routeFiles).toContain(routePath);
    }
  });

  it('tidak ada alamat lama "/dashboard/sinkron", "/laporan/csv", `/pesanan/${…}/wa` di kode', () => {
    const oldUrlPatterns = [
      /(?<!\/api)\/dashboard\/sinkron/,
      /(?<!\/api)\/laporan\/csv/,
      /(?<!\/api)\/pesanan\/(?:\$\{[^}]*\}|[^/\s"'`]+)\/wa\b/,
    ];
    const violations = listFiles()
      .filter((file) => file !== "test/structure.test.ts")
      .filter((file) => oldUrlPatterns.some((pattern) => pattern.test(readFileSync(join(ROOT, file), "utf8"))));
    expect(violations).toEqual([]);
  });
});

describe("struktur: tema di styles/", () => {
  it("styles/kk-theme.css berisi @theme; globals.css mengimpornya dan tidak punya blok @theme", () => {
    const themePath = join(ROOT, "styles/kk-theme.css");
    expect(existsSync(themePath)).toBe(true);
    expect(readFileSync(themePath, "utf8")).toContain("@theme");
    const globals = readFileSync(join(ROOT, "app/globals.css"), "utf8");
    expect(globals).toContain('@import "../styles/kk-theme.css";');
    expect(globals).not.toContain("@theme");
  });
});
