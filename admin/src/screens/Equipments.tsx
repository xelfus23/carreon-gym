import { useMemo, useState } from "react";
import { useEquipments } from "../hooks/useEquipments";
import { Dumbbell, Layers, Activity } from "lucide-react";
import CustomTable from "../components/CustomTable";
import CustomHeader from "../components/CustomHeader";
import ToolBar, { type SelectProps } from "../components/ToolBar";
import EquipmentRow from "../components/TableRows/EquipmentRow";
import type { ConfirmDialogTypes, EquipmentProps, FormField } from "../types";

import EditModal from "../components/Modals/EditModal";
import AddModal from "../components/Modals/AddModal";
import ConfirmDialog from "../components/Modals/ConfirmDialog";

type SortKey = keyof EquipmentProps | null;
type SortDir = "asc" | "desc";

const EQUIPMENT_FIELDS: FormField[] = [
  { name: "icon_url", label: "Equipment Image", type: "image", placeholder: "", gridSpan: "full" },
  { name: "equipment_name", label: "Equipment Name", type: "text", placeholder: "e.g., Olympic Barbell", required: true, gridSpan: "full" },
  {
    name: "type",
    label: "Equipment Type",
    type: "select",
    required: true,
    options: [
      { label: "Machine", value: "machine" },
      { label: "Accessory", value: "accessory" },
      { label: "Cardio", value: "cardio" },
      { label: "Dumbbell", value: "dumbbell" },
      { label: "Barbell", value: "barbell" },
      { label: "Plate", value: "plate" },
    ],
  },
  {
    name: "category", label: "Category", type: "select", required: true,
    options: [
      { label: "Free Weights", value: "Free Weight" },
      { label: "Accessories", value: "Accessory" },
      { label: "Cardio", value: "Cardio" },
      { label: "Machines", value: "Machine" },
    ],
  },
  { name: "quantity", label: "Quantity", type: "number", placeholder: "Enter quantity", required: true },
  { name: "weight_lb", label: "Weight In Lbs (Optional for Dumbbells)", type: "number", placeholder: "e.g., 50" },
  { name: "is_available", label: "In Service / Available", type: "checkbox" },
];

export default function Equipments() {
  const {
    equipments,
    dumbbells,
    barbellPlates,
    barbellRods,
    isLoading,
    error,
    refresh,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  } = useEquipments();

  const [activeTab, setActiveTab] = useState<"general" | "dumbbells" | "barbells">("general");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentProps | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("equipment_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogTypes>(null);

  const PAGE_SIZE = 50;

  // Compute active collection depending on current navigation tab context
  const targetCollection = useMemo(() => {
    if (activeTab === "dumbbells") return dumbbells;
    return equipments;
  }, [activeTab, equipments, dumbbells]);

  const filtered = useMemo(() => {
    let list = [...targetCollection];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (eq) =>
          (eq.equipment_name ?? "").toLowerCase().includes(q) ||
          (eq.category ?? "").toLowerCase().includes(q) ||
          (eq.type ?? "").toLowerCase().includes(q)
      );
    }

    if (filterCategory !== "all" && activeTab === "general") {
      list = list.filter((eq) => eq.category === filterCategory);
    }

    if (sortKey) {
      list.sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [targetCollection, search, filterCategory, sortKey, sortDir, activeTab]);

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

  const select: SelectProps[] = activeTab === "general" ? [
    {
      value: filterCategory,
      onChange: (e) => { setFilterCategory(e.target.value); setPage(1); },
      options: [
        { label: "All Categories", value: "all" },
        { label: "Accessories", value: "Accessory" },
        { label: "Cardio", value: "Cardio" },
        { label: "Machines", value: "Machine" },
      ],
      label: "Category"
    }
  ] : [];

  return (
    <>
      <div className="space-y-6">
        <CustomHeader
          isLoading={isLoading}
          refresh={refresh}
          buttonLabel="Add Equipment"
          hasAction={true}
          title="Equipment Management"
          icon={<Dumbbell className="text-primary" />}
          description="Manage gym infrastructure assets, dumbbells, and adjustable barbells."
          onClick={() => setIsAddModalOpen(true)}
        />

        {/* Tab Selection Row */}
        <div className="flex border-b border-border gap-2">
          <button
            onClick={() => { setActiveTab("general"); setPage(1); }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === "general" ? "border-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            Machines & Accessories ({equipments.length})
          </button>
          <button
            onClick={() => { setActiveTab("dumbbells"); setPage(1); }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === "dumbbells" ? "border-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            Fixed Dumbbells Set ({dumbbells.length})
          </button>
          <button
            onClick={() => { setActiveTab("barbells"); setPage(1); }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === "barbells" ? "border-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            Barbell Plates & Rod Rigs
          </button>
        </div>

        {activeTab !== "barbells" ? (
          <div className="bg-surface border border-border shadow-sm overflow-hidden min-w-0">
            <ToolBar
              search={search}
              handleSearchChange={(e) => { setSearch(e.target.value); setPage(1); }}
              select={select}
              filtered={filtered}
              placeholder={activeTab === "dumbbells" ? "Search dumbbells..." : "Search machinery..."}
            />

            <CustomTable
              renderRow={(eq: EquipmentProps) => (
                <EquipmentRow
                  key={eq.id}
                  equipment={eq}
                  onEdit={setSelectedEquipment}
                  onDelete={(e) => setConfirmDialog({
                    title: "Delete Equipment",
                    message: `Permanently delete ${e.equipment_name}?`,
                    confirmLabel: "Delete",
                    variant: "danger",
                    onConfirm: async () => { setConfirmDialog(null); await deleteEquipment(e.id); refresh(); },
                    onClose: () => setConfirmDialog(null)
                  })}
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
                // { label: "Icon", key: "icon_url" },
                { label: "Equipment Name", key: "equipment_name", sortable: true },
                { label: "Category", key: "category", sortable: true },
                { label: "Qty", key: "quantity", sortable: true },
                { label: "", key: null },
              ]}
            />
          </div>
        ) : (
          /* Separate layout dedicated specifically to Adjustable Barbells Racks */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Barbell Rods Panel */}
            <div className="bg-surface border border-border p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Activity className="text-primary" size={18} />
                <h3 className="font-bold text-text-primary">Barbell Shafts & Rods</h3>
              </div>
              <div className="divide-y divide-border">
                {barbellRods.map((rod) => (
                  <div key={rod.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{rod.name}</p>
                      <span className={`text-[10px] uppercase font-bold ${rod.is_available ? "text-emerald-500" : "text-danger"}`}>
                        {rod.is_available ? "In Service" : "Maintenance"}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-text-primary bg-background px-3 py-1 border border-border rounded-md">
                      {rod.quantity} pcs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Loose Weight Plates Panel */}
            <div className="bg-surface border border-border p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Layers className="text-amber-500" size={18} />
                <h3 className="font-bold text-text-primary">Loose Weight Plate Stack Rack</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {barbellPlates.map((plate) => (
                  <div key={plate.weight_lb} className="bg-background border border-border p-4 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-text-secondary">{Number(plate.weight_lb)} lbs</span>
                    <span className="text-xl font-black text-text-primary mt-1">{plate.quantity} <span className="text-xs font-normal text-text-secondary">pcs</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 bg-danger/8 border border-danger/30 px-4 py-3">
            <p className="text-sm text-danger font-medium">{error}</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={refresh}
          title="Add New Equipment"
          subtitle="Log a new item into the gym management database."
          fields={EQUIPMENT_FIELDS}
          onSave={(data: EquipmentProps, imageFile: File | null) => createEquipment(data, imageFile)}
          submitButtonText="Create Record"
        />
      )}

      {selectedEquipment && (
        <EditModal
          isOpen={!!selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          onSuccess={refresh}
          title="Edit Equipment Properties"
          subtitle="Modify details or inventory tracking fields."
          fields={EQUIPMENT_FIELDS}
          initialData={selectedEquipment as EquipmentProps}
          onSave={(data: Partial<EquipmentProps>, imageFile: File | null) => updateEquipment(selectedEquipment.id, data, imageFile)}
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