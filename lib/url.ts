/** `path` dengan query `current` yang diubah; nilai kosong/null atau yang ada di `kosong` menghapus parameternya. */
export function buildUrl(
  path: string,
  current: URLSearchParams | string,
  changes: Record<string, string | null | undefined>,
  emptyValues: string[] = [],
): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value && !emptyValues.includes(value)) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
