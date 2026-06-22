import type { Dispatch, SetStateAction } from "react";

interface PaginationProps<T> {
  page: number;
  totalPages: number;
  setPage: Dispatch<SetStateAction<number>>;
  data: T[];
}

export default function PaginationComponent<T>({
  page,
  totalPages,
  setPage,
  data,
}: PaginationProps<T>) {
  return (
    <div className="px-5 py-3 border-t border-border bg-surface/60 flex items-center justify-between">
      <div className="flex space-x-4">
        <span className="text-xs text-text-secondary">
          Page {page} of {totalPages}
        </span>
        <div className="bg-border w-px" />
        <span className="ml-auto text-xs text-text-secondary font-medium whitespace-nowrap">
          {data.length} result
          {data.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 rounded-md py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border text-text-primary disabled:opacity-40 transition-colors"
        >
          ← Prev
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          return (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 rounded-lg py-1.5 text-xs font-semibold border transition-colors ${
                p === page
                  ? "bg-primary-dark text-background border-primary-dark"
                  : "border-border bg-surface hover:bg-border text-text-primary"
              }`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 rounded-md py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border text-text-primary disabled:opacity-40 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
