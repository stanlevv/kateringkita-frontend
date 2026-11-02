/** `path` dengan query `current` yang diubah; nilai kosong/null atau yang ada di `kosong` menghapus parameternya. */
export function urlDengan(
  path: string,
  current: URLSearchParams | string,
  ubahan: Record<string, string | null | undefined>,
  kosong: string[] = [],
): string {
  const p = new URLSearchParams(current);
  for (const [k, v] of Object.entries(ubahan)) {
    if (v && !kosong.includes(v)) p.set(k, v);
    else p.delete(k);
  }
  const qs = p.toString();
  return qs ? `${path}?${qs}` : path;
}
