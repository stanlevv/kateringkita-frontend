// Penjaga kerangka memuat: tiap halaman punya loading.tsx sendiri, dan judul/deskripsi statisnya sama persis
// dengan PageHeader halamannya, supaya saat data datang hanya isi yang berganti (tanpa lompatan).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");
// Alat dev; cukup kerangka netral app/(dashboard)/loading.tsx.
const EXCLUDED_PAGES = new Set(["app/(dashboard)/pratinjau"]);
// Judul halaman dari data (kode pesanan, nama toko, kode tiket), jadi judul kerangkanya ikut dikerangkakan.
const DATA_TITLE_PAGES = new Set([
  "app/(dashboard)/pesanan/[code]",
  "app/(admin)/admin/penjual/[id]",
  "app/(admin)/admin/tiket/[code]",
]);

const toRelative = (filePath: string) => relative(ROOT, filePath).split(sep).join("/");
const readText = (filePath: string) => readFileSync(filePath, "utf8");
const findFiles = (dir: string, fileName: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? findFiles(join(dir, entry.name), fileName)
      : entry.name === fileName
        ? [join(dir, entry.name)]
        : [],
  );

/** page.tsx + komponen milik halaman itu (judul dashboard ada di components/DashboardLive.tsx). */
function pageSource(folder: string): string {
  const componentsDir = join(folder, "components");
  const components = existsSync(componentsDir)
    ? readdirSync(componentsDir)
        .filter((name) => name.endsWith(".tsx") && !name.includes(".test."))
        .map((name) => readText(join(componentsDir, name)))
    : [];
  return [readText(join(folder, "page.tsx")), ...components].join("\n");
}

describe("kerangka memuat", () => {
  const pageDirs = ["app/(dashboard)", "app/(admin)"]
    .flatMap((group) => findFiles(join(ROOT, group), "page.tsx"))
    .map(dirname);

  it("penjaga menemukan halaman (bukan lolos kosong)", () => {
    expect(pageDirs.length).toBeGreaterThan(20);
  });

  it("tiap halaman punya loading.tsx sendiri (bukan kerangka halaman lain)", () => {
    expect(
      pageDirs
        .filter((pageDir) => !EXCLUDED_PAGES.has(toRelative(pageDir)) && !existsSync(join(pageDir, "loading.tsx")))
        .map(toRelative),
    ).toEqual([]);
  });

  it("judul & deskripsi kerangka = PageHeader halaman", () => {
    const mismatches: string[] = [];
    let checkedCount = 0;
    let skeletonFileCount = 0;
    for (const pageDir of pageDirs) {
      const skeletonFile = join(pageDir, "loading.tsx");
      if (!existsSync(skeletonFile)) continue;
      skeletonFileCount++;
      const skeleton = readText(skeletonFile);
      // `title=` milik PageFrame dan MenuFormSkeleton (halaman menu baru/ubah).
      const title = /\btitle="([^"]+)"/.exec(skeleton)?.[1];
      if (!title) {
        // Hanya halaman yang judulnya dari data (kode pesanan, nama toko) boleh tanpa judul statis.
        if (!DATA_TITLE_PAGES.has(toRelative(pageDir)))
          mismatches.push(`${toRelative(skeletonFile)}: tidak ada judul statis`);
        continue;
      }
      checkedCount++;
      const headerMatches = [
        ...pageSource(pageDir).matchAll(/<PageHeader\s+title="([^"]+)"(?:\s+description="([^"]+)")?/g),
      ].filter((match) => match[1] === title);
      const description = /\bdescription="([^"]+)"/.exec(skeleton)?.[1];
      const expectedDescription = headerMatches.map((match) => match[2]).find(Boolean);
      if (headerMatches.length === 0)
        mismatches.push(`${toRelative(skeletonFile)}: tidak ada <PageHeader title="${title}">`);
      else if (description !== expectedDescription)
        mismatches.push(
          `${toRelative(skeletonFile)}: deskripsi "${description ?? ""}", halaman "${expectedDescription ?? ""}"`,
        );
    }
    expect(mismatches).toEqual([]);
    // Penjaga agar tidak lolos diam-diam: semua kerangka berjudul statis benar-benar dibandingkan.
    expect(checkedCount).toBe(skeletonFileCount - DATA_TITLE_PAGES.size);
  });
});
