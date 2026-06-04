import { useMemo, useState } from "react";
import { useEquipments } from "../hooks/useEquipments";
import { Dumbbell, Loader2 } from "lucide-react";
import CustomTable from "../components/CustomTable";
import CustomHeader from "../components/CustomHeader";
import ToolBar, { type SelectProps } from "../components/ToolBar";
import EquipmentRow from "../components/TableRows/EquipmentRow";
import type { ConfirmDialogTypes, EquipmentProps, FormField } from "../types";

// Import your universal dynamic modals
import EditModal from "../components/Modals/EditModal";
import AddModal from "../components/Modals/AddModal";
import ConfirmDialog from "../components/Modals/ConfirmDialog";

type SortKey = keyof EquipmentProps | null;
type SortDir = "asc" | "desc";

// Define the schema configuration outside the render cycle
const EQUIPMENT_FIELDS: FormField[] = [
  {
    name: "icon_url",
    label: "Equipment Image",
    type: "image",
    placeholder: "",
    gridSpan: "full"
  },
  {
    name: "equipment_name",
    label: "Equipment Name",
    type: "text",
    placeholder: "e.g., Olympic Barbell",
    required: true,
    gridSpan: "full",
  },
  {
    name: "category",
    label: "Category",
    type: "select",
    required: true,
    options: [
      { label: "Free Weights", value: "Free Weight" },
      { label: "Accessories", value: "Accessory" },
      { label: "Cardio", value: "Cardio" },
      { label: "Machines", value: "Machine" },
    ],
  },
  {
    name: "quantity",
    label: "Quantity",
    type: "number",
    placeholder: "Enter quantity",
    required: true,
  },
];

export default function Equipments() {
  const {
    equipments,
    isLoading,
    error,
    refresh,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  } = useEquipments();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentProps | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("equipment_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogTypes>(null)

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

  const onEdit = (e: EquipmentProps) => {
    setSelectedEquipment(e);
  };

  const onDelete = (e: EquipmentProps) => {
    setConfirmDialog({
      title: "Delete Equipment",
      message: `Permanently delete ${e.equipment_name}? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        await deleteEquipment(e.id);
        refresh();
      },
      onClose: () => setConfirmDialog(null)
    });
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
        { label: "All", value: "all" },
        { label: "Free Weights", value: "Free Weight" },
        { label: "Accessories", value: "Accessory" },
        { label: "Cardio", value: "Cardio" },
        { label: "Machines", value: "Machine" },
      ],
      label: "Category"
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
          onClick={() => setIsAddModalOpen(true)}
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
            renderRow={(eq: EquipmentProps) => (
              <EquipmentRow
                key={eq.id}
                equipment={eq}
                onEdit={onEdit}
                onDelete={onDelete}
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
              { label: "Icon", key: "icon_url" },
              { label: "Equipment", key: "equipment_name", sortable: true },
              { label: "Category", key: "category", sortable: true },
              { label: "Qty", key: "quantity", sortable: true },
              { label: "", key: null },
            ]}
          />
        </div>

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

      {/* ── Universal Create Modal ── */}
      {isAddModalOpen && (
        <AddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={refresh}
          title="Add New Equipment"
          subtitle="Register inventory logs inside management pipelines"
          fields={EQUIPMENT_FIELDS}
          onSave={(data: EquipmentProps) => createEquipment(data)}
          submitButtonText="Create Record"
        />
      )}

      {/* ── Universal Edit Modal ── */}
      {selectedEquipment && (
        <EditModal
          isOpen={!!selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          onSuccess={refresh}
          title="Edit Equipment Properties"
          subtitle="Adjust technical specifications or quantity totals"
          fields={EQUIPMENT_FIELDS}
          initialData={selectedEquipment as EquipmentProps}
          onSave={(data: Partial<EquipmentProps>) => updateEquipment(selectedEquipment.id, data)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          isOpen={!!confirmDialog}
          onClose={confirmDialog.onClose}
          onConfirm={confirmDialog.onConfirm}
          variant={confirmDialog.variant}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
        />
      )}
    </>
  );
}
