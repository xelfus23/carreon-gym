import { useEffect, useMemo, useRef, useState } from "react";
import { useGymSubs } from "../hooks/useGymSubs";
import ConfirmDialog from "../components/ConfirmDialog";
import { Dumbbell, Zap, Users, Layers, Loader2 } from "lucide-react";
import CustomHeader from "../components/CustomHeader";
import StatsCard from "../components/CustomStatsCard";
import CustomTable from "../components/CustomTable";
import type { FormField, SubscriptionPlanProps } from "../types";
import ToolBar, { type SelectProps } from "../components/ToolBar";
import SubscriptionsRow from "../components/TableRows/SubscriptionsRow";
import EditModal from "../components/Modals/EditModal";
// import { subscriptionService } from "../services/subscription.service";
import AddModal from "../components/Modals/AddModal";

type SortKey = keyof SubscriptionPlanProps | null;
type SortDir = "asc" | "desc";

const fields: FormField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Enter the name of the subscription plan",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter the description of the subscription plan",
  },
  {
    name: "category",
    label: "Category",
    type: "select",
    placeholder: "Select the category of the subscription plan",
    options: [
      { label: "Membership", value: "membership" },
      { label: "Class", value: "class" },
      { label: "Personal Trainer", value: "personal_training" },
      { label: "Addon", value: "add_on" },
    ],
  },
  {
    name: "duration_days",
    label: "Duration (Days)",
    type: "number",
    placeholder: "Enter the duration of the subscription plan in days",
  },
  {
    name: "price",
    label: "Price",
    type: "number",
    placeholder: "Enter the price of the subscription plan",
  },
  {
    name: "is_active",
    label: "Active",
    type: "checkbox",
    placeholder: "Is the subscription plan active?",
  },
];

export default function GymSubscriptionsAdmin() {
  const { membership, classes, addOns, personalTrainer, isLoading, refresh } =
    useGymSubs();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterSub, setFilterSub] = useState("all");
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionPlanProps | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    variant: "warning" | "danger";
    onConfirm: () => void;
  } | null>(null);

  const menuWrapRef = useRef<HTMLDivElement | null>(null);
  const PAGE_SIZE = 10;

  const allPlans = useMemo(() => {
    return [
      ...(membership || []),
      ...(classes || []),
      ...(personalTrainer || []),
      ...(addOns || []),
    ];
  }, [membership, classes, personalTrainer, addOns]);

  const filtered = useMemo(() => {
    let list = [...allPlans];

    if (filterSub !== "all") {
      list = list.filter(
        (p) => p.category.toLowerCase() === filterSub.toLowerCase(),
      );
    }

    if (search.trim() !== "") {
      const term = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term),
      );
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
  }, [allPlans, search, filterSub, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

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
          Loading plan records...
        </p>
      </div>
    );

  const cards = [
    {
      label: "Active Plans",
      value: allPlans.length,
      icon: <Layers size={16} />,
      color: "border-primary/20 bg-primary/5 text-primary",
    },
    {
      label: "Memberships",
      value: membership?.length || 0,
      icon: <Zap size={16} />,
      color: "border-blue-500/20 bg-blue-500/5 text-blue-500",
    },
    {
      label: "Class Tiers",
      value: classes?.length || 0,
      icon: <Dumbbell size={16} />,
      color: "border-amber-500/20 bg-amber-500/5 text-amber-500",
    },
    {
      label: "Personal Training Sessions",
      value: personalTrainer?.length || 0,
      icon: <Users size={16} />,
      color: "border-purple-500/20 bg-purple-500/5 text-purple-500",
    },
  ];

  const select: SelectProps[] = [
    {
      value: filterSub,
      onChange: (e) => {
        setFilterSub(e.target.value);
        setPage(1);
      },
      options: [
        { label: "All Subscriptions", value: "all" },
        { label: "Membership", value: "membership" },
        { label: "Class", value: "class" },
        { label: "Personal Trainer", value: "personal_training" },
        { label: "Addon", value: "add_on" },
      ],
    },
  ];

  const saveEdit = async (
    id: number | undefined,
    data: Partial<SubscriptionPlanProps>,
  ) => {
    console.log(data);
    // await subscriptionService.updatePlan(id!, data);
  };

  return (
    <div className="space-y-4">
      {/* ── Header Section ── */}
      <CustomHeader
        hasAction={true}
        title="Subscription Manager"
        icon={<Dumbbell className="text-primary" />}
        description="Manage and configure carreon gym plan offerings"
        refresh={refresh}
        onClick={() => setIsAddModalOpen(true)}
        buttonLabel="Create New Plan"
        isLoading={isLoading}
      />

      {/* ── Stats Grid (Identical to Transaction Stats) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {cards.map(({ label, value, color, icon }) => (
          <StatsCard
            key={label}
            label={label}
            value={value}
            color={color}
            icon={icon}
          />
        ))}
      </div>

      <div
        ref={menuWrapRef}
        className="bg-surface border border-border shadow-sm overflow-hidden flex flex-col"
      >
        <ToolBar
          search={search}
          handleSearchChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          select={select}
          filtered={filtered}
          placeholder="Search plan name or category..."
        />

        <CustomTable<SubscriptionPlanProps>
          renderRow={(sub) => (
            <SubscriptionsRow
              plan={sub}
              onClick={() => {
                setIsEditModalOpen(true);
                setSelectedSubscription(sub);
              }}
            />
          )}
          onSort={handleSort}
          data={paginated}
          totalItems={totalPages}
          setPage={setPage}
          page={page}
          pageSize={PAGE_SIZE}
          columns={[
            { label: "Plan ID", key: "id" },
            { label: "Name", key: "name" },
            { label: "Description", key: "description" },
            { label: "Category", key: "category" },
            { label: "Duration", key: "duration_days" },
            { label: "Price", key: "price" },
            { label: "Status", key: "is_active" },
            { label: "", key: null },
          ]}
        />
      </div>

      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => {
            setConfirmDialog(null);
            setIsEditModalOpen(false);
            setSelectedSubscription(null);
          }}
        />
      )}

      {isEditModalOpen && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={refresh}
          title="Edit Subscription"
          subtitle="Edit the subscription plan"
          fields={fields}
          initialData={selectedSubscription}
          onSave={(data) => saveEdit(selectedSubscription?.id, data)}
        />
      )}

      {isAddModalOpen && (
        <AddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={refresh}
          title="Add Subscription"
          subtitle="Add a subscription plan"
          fields={fields}
          onSave={(data) => saveEdit(selectedSubscription?.id, data)}
          submitButtonText="Add Subscription"
        />
      )}
    </div>
  );
}
