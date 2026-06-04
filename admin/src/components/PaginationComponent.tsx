import type { Dispatch, SetStateAction } from "react";

interface PaginationProps {
  page: number,
  totalPages: number,
  setPage: Dispatch<SetStateAction<number>>
}

export default function PaginationComponent({ page, totalPages, setPage }: PaginationProps) {

  return (
    <div className="px-5 py-3 border-t border-border bg-surface/60 flex items-center justify-between">
      <span className="text-xs text-text-secondary">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() =>
            setPage((p) => Math.max(1, p - 1))
          }
          disabled={page === 1}
          className="px-3 rounded-md py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border text-text-primary disabled:opacity-40 transition-colors"
        >
          ← Prev
        </button>
        {Array.from(
          { length: Math.min(5, totalPages) },
          (_, i) => {
            const p =
              Math.max(
                1,
                Math.min(
                  page - 2,
                  totalPages - 4,
                ),
              ) + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 rounded-lg py-1.5 text-xs font-semibold border transition-colors ${p === page
                  ? "bg-primary-dark text-background border-primary-dark"
                  : "border-border bg-surface hover:bg-border text-text-primary"
                  }`}
              >
                {p}
              </button>
            );
          },
        )}
        <button
          onClick={() =>
            setPage((p) =>
              Math.min(totalPages, p + 1),
            )
          }
          disabled={page === totalPages}
          className="px-3 rounded-md py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border text-text-primary disabled:opacity-40 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}