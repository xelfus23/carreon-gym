import { useMemo, useState } from "react";
import { useEquipments, type EquipmentTypes } from "../hooks/useEquipments";
import EquipmentRow, {
  SkeletonRow,
} from "../components/equipment/EquipmentRow";
import {
  AddModal,
  EditModal,
  DeleteModal,
} from "../components/equipment/EquipmentModals";
import { Dumbbell, Loader2, Plus, Search } from "lucide-react";

type SortKey = keyof EquipmentTypes | null;
type SortDir = "asc" | "desc";

// ─── Equipment Tab ─────────────────────────────────────────────────────────────

export default function EquipmentTab() {
  const {
    equipments,
    isLoading,
    error,
    refresh,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  } = useEquipments();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<EquipmentTypes | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EquipmentTypes | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("equipment_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          equipments
            .map((eq) => eq.category?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [equipments],
  );

  const filtered = useMemo(() => {
    let list = [...equipments];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (eq) =>
          eq.equipment_name.toLowerCase().includes(q) ||
          (eq.category ?? "").toLowerCase().includes(q) ||
          (eq.target_muscles ?? "").toLowerCase().includes(q) ||
          eq.description?.toLowerCase().includes(q),
      );
    }

    if (filterCategory !== "all") {
      list = list.filter((eq) => eq.category === filterCategory);
    }

    if (sortKey) {
      list.sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
        });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [equipments, search, filterCategory, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir("asc");
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      <span className="ml-1 text-text-secondary">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    ) : (
      <span className="ml-1 opacity-30 group-hover:opacity-60">↕</span>
    );

  if (isLoading)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Loader2
          size={26}
          className="animate-spin text-primary stroke-primary"
        />
        <p className="text-text-secondary animate-pulse">
          Loading equipment records...
        </p>
      </div>
    );

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Dumbbell className="text-primary" /> Equipment Management
        </h1>
        <div className="flex items-center gap-2 ml-auto">
          {!isLoading && (
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border
                                           text-text-secondary text-xs font-semibold uppercase tracking-wider
                                           hover:border-primary/40 hover:text-primary transition-all duration-150"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-background hover:opacity-90 transition-all text-sm font-medium"
          >
            <Plus size={16} /> Add Equipment
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-6">
        <div className="bg-surface border border-border shadow-sm overflow-hidden min-w-0">
          <div className="p-4 border-b border-border bg-surface flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                <Search size={14} />
              </span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                type="text"
                placeholder="Search equipment, category, muscle..."
                className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-text-primary"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-surface border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between">
              {!isLoading && !error && (
                <p className="text-xs text-text-secondary">
                  {filtered.length} result
                  {filtered.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto h-[500px]">
            <table className="text-left text-sm w-full">
              <thead className="sticky top-0">
                <tr className="bg-surface text-text-primary font-bold uppercase tracking-wider border-b border-border">
                  {(
                    [
                      { label: "ID", key: "id" },
                      {
                        label: "Equipment",
                        key: "equipment_name",
                      },
                      {
                        label: "Category",
                        key: "category",
                      },
                      { label: "Qty", key: "quantity" },
                      {
                        label: "Target Muscles",
                        key: "target_muscles",
                      },
                      {
                        label: "Description",
                        key: "description",
                      },
                      { label: "", key: null },
                    ] as { label: string; key: SortKey }[]
                  ).map(({ label, key }) => (
                    <th
                      key={label || "actions"}
                      onClick={() => handleSort(key)}
                      className={`px-5 py-3.5 text-xs group ${
                        key
                          ? "cursor-pointer select-none hover:text-text-secondary"
                          : ""
                      }`}
                    >
                      {label}
                      {key && <SortIcon col={key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-text-secondary text-sm"
                    >
                      {equipments.length === 0
                        ? "No equipment found yet."
                        : "No equipment match your filters."}
                    </td>
                  </tr>
                ) : (
                  paginated.map((eq) => (
                    <EquipmentRow
                      key={eq.id}
                      item={eq}
                      onEdit={setEditTarget}
                      onDelete={setDeleteTarget}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && (
            <div className="px-5 py-3 border-t border-border bg-surface/60 flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border text-text-primary disabled:opacity-40 transition-colors"
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
                          ? "bg-primary text-background border-primary"
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
                  className="px-3 py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border text-text-primary disabled:opacity-40 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-2.5 bg-danger/8 border border-danger/30 px-4 py-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff3b3b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-danger font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <AddModal
          onCreate={createEquipment}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editTarget && (
        <EditModal
          item={editTarget}
          onUpdate={updateEquipment}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onDelete={deleteEquipment}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
