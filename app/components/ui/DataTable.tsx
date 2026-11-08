import type { ReactNode } from "react";
import { cx } from "./cx";

export type Column<T> = { key: string; header: string; cell: (row: T) => ReactNode; align?: "left" | "right"; wrap?: boolean };

// Klik/tombol dari tautan, tombol, atau isian di dalam sel bukan milik baris.
function dariKontrol(e: { target: EventTarget; currentTarget: HTMLElement }) {
  const k = (e.target as HTMLElement).closest("a,button,input,select,textarea,label");
  return !!k && e.currentTarget.contains(k);
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, caption }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; onRowClick?: (row: T) => void; caption: string }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cx("sticky top-0 bg-subtle px-4 py-3 font-medium text-ink-muted", c.align === "right" && "text-right")}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={rowKey(r)}
              onClick={onRowClick && ((e) => !dariKontrol(e) && onRowClick(r))}
              onKeyDown={onRowClick && ((e) => {
                if ((e.key === "Enter" || e.key === " ") && !dariKontrol(e)) { e.preventDefault(); onRowClick(r); }
              })}
              tabIndex={onRowClick ? 0 : undefined}
              className={cx("border-t border-line", onRowClick && "cursor-pointer hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus")}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx("min-h-11 px-4 py-3 text-ink", c.wrap ? "min-w-56 max-w-md whitespace-normal break-words" : "whitespace-nowrap", c.align === "right" && "text-right font-mono")}>{c.cell(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
