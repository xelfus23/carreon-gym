import type { Dispatch, SetStateAction } from "react";
import PaginationComponent from "./PaginationComponent";

export interface ColumnDefinition<T> {
  label: string;
  key: keyof T | null;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: ColumnDefinition<T>[];
  data: T[];
  onSort?: (key: keyof T) => void;
  page: number;
  pageSize: number;
  totalItems: number;
  setPage: Dispatch<SetStateAction<number>>;
  renderRow: (item: T) => React.ReactNode;
}

export default function CustomTable<T>(props: TableProps<T>) {
  const {
    columns,
    data,
    onSort,
    page,
    pageSize,
    totalItems,
    setPage,
    renderRow,
  } = props;

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <>
      <div className=" overflow-y-auto h-125">
        <table className="text-left text-sm w-full">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-background">
              {columns.map((col, idx) => (
                <th
                  key={col.label + idx}
                  onClick={() => col.sortable && col.key && onSort?.(col.key)}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-16 text-center text-text-secondary text-sm whitespace-nowrap"
                >
                  No data available.
                </td>
              </tr>
            ) : (
              data.map((item) => renderRow(item))
            )}
          </tbody>
        </table>
      </div>
      <PaginationComponent
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
    </>
  );
}
