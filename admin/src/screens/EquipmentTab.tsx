import { useMemo, useState } from "react";
import { useEquipments, type EquipmentTypes } from "../hooks/useEquipments";
import {
  AddModal,
  EditModal,
  DeleteModal,
} from "../components/equipment/EquipmentModals";
import { Dumbbell, Loader2 } from "lucide-react";
import CustomTable from "../components/CustomTable";
import CustomHeader from "../components/CustomHeader";
import ToolBar, { type SelectProps } from "../components/ToolBar";
import EquipmentRow from "../components/TableRows/EquipmentRow";

type SortKey = keyof EquipmentTypes | null;
type SortDir = "asc" | "desc";

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

  const select: SelectProps[] = [
    {
      value: filterCategory,
      onChange: (e) => {
        setFilterCategory(e.target.value);
        setPage(1);
      },
      options: [
        { label: "All Equipments", value: "all" },
        { label: "Free Weights", value: "Free Weight" },
        { label: "Accessories", value: "Accessory" },
        { label: "Cardio", value: "Cardio" },
        { label: "Machines", value: "Machine" },
      ],
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <CustomHeader
          isLoading={isLoading}
          refresh={refresh}
          buttonLabel="Add Equipment"
          hasAction={true}
          title="Equipment Management"
          icon={<Dumbbell className="text-primary" />}
          description="Manage carreon gym equipments"
        />

        <div className="flex-1 bg-surface border border-border shadow-sm overflow-hidden min-w-0">
          <ToolBar
            search={search}
            handleSearchChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            select={select}
            filtered={filtered}
            placeholder="Search equipment name, category..."
          />

          <CustomTable
            renderRow={(eq: EquipmentTypes) => (
              <EquipmentRow
                key={eq.id}
                item={eq}
                onEdit={(eq) => setEditTarget(eq)}
                onDelete={(eq) => setDeleteTarget(eq)}
              />
            )}
            data={paginated}
            totalItems={totalPages}
            setPage={setPage}
            page={page}
            pageSize={PAGE_SIZE}
            onSort={handleSort}
            columns={[
              { label: "ID", key: "id", sortable: true },
              { label: "Equipment", key: "equipment_name", sortable: true },
              { label: "Category", key: "category", sortable: true },
              { label: "Qty", key: "quantity", sortable: true },
              {
                label: "Target Muscles",
                key: "target_muscles",
                sortable: true,
              },
              { label: "Description", key: "description", sortable: true },
              { label: "", key: null },
            ]}
          />
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
