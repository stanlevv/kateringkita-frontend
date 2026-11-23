// Komponen DataTable: tabel data serbaguna; kolom ditentukan pemanggil, baris bisa diklik atau dipilih dengan keyboard.
// Dipakai tabel admin (penjual, log, master, ...) dan daftar pesanan/transaksi penjual.
import type { ReactNode } from "react";
import { cx } from "./cx";

/** Definisi satu kolom: kunci, judul, cara menggambar sel, rata kanan untuk angka, dan boleh membungkus teks. */
export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  wrap?: boolean;
};

/**
 * Klik/tombol dari tautan, tombol, atau isian di dalam sel bukan milik baris.
 * @param event event klik atau keyboard pada baris
 * @returns true bila asalnya dari kontrol di dalam sel
 */
function isFromControl(event: { target: EventTarget; currentTarget: HTMLElement }) {
  const control = (event.target as HTMLElement).closest("a,button,input,select,textarea,label");
  return !!control && event.currentTarget.contains(control);
}

/**
 * Tabel data. Bila `onRowClick` ada, baris bisa difokus (Tab) dan diaktifkan dengan klik, Enter, atau Spasi;
 * klik pada tautan/tombol/isian di dalam sel tidak ikut mengaktifkan baris.
 * @param props.columns definisi kolom
 * @param props.rows data baris
 * @param props.rowKey membuat kunci unik tiap baris
 * @param props.onRowClick dipanggil dengan baris yang dipilih (opsional)
 * @param props.caption nama tabel untuk pembaca layar
 * @returns elemen `div` berisi `table`
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  onRowClick?: (row: T) => void;
  caption: string;
}) {
  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  "sticky top-0 bg-subtle px-4 py-3 font-medium text-ink-muted",
                  column.align === "right" && "text-right",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              onClick={onRowClick && ((event) => !isFromControl(event) && onRowClick(row))}
              onKeyDown={
                onRowClick &&
                ((event) => {
                  if ((event.key === "Enter" || event.key === " ") && !isFromControl(event)) {
                    event.preventDefault();
                    onRowClick(row);
                  }
                })
              }
              tabIndex={onRowClick ? 0 : undefined}
              className={cx(
                "border-t border-line",
                onRowClick && "cursor-pointer hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus",
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    "min-h-11 px-4 py-3 text-ink",
                    column.wrap ? "min-w-56 max-w-md whitespace-normal break-words" : "whitespace-nowrap",
                    column.align === "right" && "text-right font-mono",
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
