import type { ReactNode } from "react";
import { cx } from "./cx";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  wrap?: boolean;
};

// Klik/tombol dari tautan, tombol, atau isian di dalam sel bukan milik baris.
function isFromControl(event: { target: EventTarget; currentTarget: HTMLElement }) {
  const control = (event.target as HTMLElement).closest("a,button,input,select,textarea,label");
  return !!control && event.currentTarget.contains(control);
}

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
