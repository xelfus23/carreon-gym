import { useMemo, useState } from "react";
import { useMember } from "../hooks/useMember";
import type {
  UserAccountProps,
  ConfirmDialogTypes,
  FormField,
} from "../types";
import MemberRow from "../components/TableRows/MemberRow";
import SubscriptionModal from "../components/SubscriptionModal";
import { CircleAlert, CircleCheck, Loader2, Star, Users } from "lucide-react";
import CustomTable from "../components/CustomTable";
import CustomHeader from "../components/CustomHeader";
import StatsCard from "../components/CustomStatsCard";
import { COLORS } from "../constants";
import type { SelectProps } from "../components/ToolBar";
import ToolBar from "../components/ToolBar";
import ConfirmDialog from "../components/Modals/ConfirmDialog";
import AddModal from "../components/Modals/AddModal";

export type SortKey = keyof UserAccountProps | null;
export type SortDir = "asc" | "desc";
export type FilterStatus =
  | "all"
  | "active"
  | "suspended"
  | "banned"
  | "deleted";
export type FilterSub = "all" | "active" | "expired" | "pending" | "cancelled";



const fields: FormField[] = [
  {
    name: "first_name",
    label: "First Name",
    type: "text",
    gridSpan: "half",
    required: true
  },
  {
    name: "last_name",
    label: "Last Name",
    type: "text",
    gridSpan: "half",
    required: true
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    gridSpan: "full",
    required: true
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    gridSpan: "half",
    required: true
  },
  {
    name: "phone_number",
    label: "Phone Number",
    type: "phone",
    gridSpan: "half",
    required: true
  }
];



export default function Members() {
  const {
    members,
    refresh,
    isLoading,
    verifyAccount,
    deleteAccount,
    banAccount,
    suspendAccount,
    createAccount
  } = useMember();
  const [subscriptionMember, setSubscriptionMember] =
    useState<UserAccountProps | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Table controls
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("active");
  const [filterSub, setFilterSub] = useState<FilterSub>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogTypes>(null);

  // ── Action handlers ────────────────────────────────────────────────────

  const handleSuspend = (m: UserAccountProps) => {
    const isSuspended = m.account_status === "suspended";
    setConfirmDialog({
      title: isSuspended ? "Unsuspend Member" : "Suspend Member",
      message: isSuspended
        ? `Restore access for ${m.first_name} ${m.last_name}? They will be able to log in again.`
        : `Suspend ${m.first_name} ${m.last_name}? They won't be able to log in until unsuspended.`,
      confirmLabel: isSuspended ? "Unsuspend" : "Suspend",
      variant: "warning",
      onConfirm: async () => {
        setConfirmDialog(null);
        await suspendAccount(m.id);
      },
      onClose: () => setConfirmDialog(null),
    });
  };

  const handleBan = (m: UserAccountProps) => {
    setConfirmDialog({
      title: "Ban / Blacklist Member",
      message: `Permanently ban ${m.first_name} ${m.last_name}? This will cancel their subscription and block future access.`,
      confirmLabel: "Ban Member",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        await banAccount(m.id);
      },
      onClose: () => setConfirmDialog(null),
    });
  };

  const handleDelete = (m: UserAccountProps) => {
    setConfirmDialog({
      title: "Delete Member",
      message: `Permanently delete ${m.first_name} ${m.last_name}'s account? This action cannot be undone and will remove all their data.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        await deleteAccount(m.id);
      },
      onClose: () => setConfirmDialog(null),
    });
  };

  // ── Table logic ───────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...members];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.phone_number?.includes(q),
      );
    }

    if (filterStatus !== "all")
      list = list.filter((m) => m.account_status === filterStatus);
    if (filterSub !== "all")
      list = list.filter((m) => m.subscription_status === filterSub);

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
  }, [members, search, filterStatus, filterSub, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const stats = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.account_status === "active").length,
      suspended: members.filter((m) => m.account_status === "suspended").length,
      activeSubs: members.filter((m) => m.subscription_status === "active")
        .length,
      avgAttendance: members.length
        ? Math.round(
          members.reduce((s, m) => s + m.attendance_rate, 0) / members.length,
        )
        : 0,
    }),
    [members],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleOnClick = () => {
    setIsAddModalOpen((v) => !v);
  };

  if (isLoading)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Loader2
          size={26}
          className="animate-spin text-primary stroke-primary"
        />
        <p className="text-text-secondary animate-pulse">
          Loading member records...
        </p>
      </div>
    );

  const cards = [
    {
      label: "Total Members",
      value: stats.total,
      color: "border-slate-500/30 bg-slate-500/5  text-slate-500",
      icon: <Users size={16} />,
    },
    {
      label: "Active Accounts",
      value: stats.active,
      color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-500",
      icon: <CircleCheck size={16} />,
    },
    {
      label: "Suspended",
      value: stats.suspended,
      color: "border-amber-500/30 bg-amber-500/5 text-amber-500",
      icon: <CircleAlert size={16} />,
    },
    {
      label: "Active Subs",
      value: stats.activeSubs,
      color: "border-indigo-500/30 bg-indigo-500/5 text-indigo-500",
      icon: <Star size={16} />,
    },
  ];

  const select: SelectProps[] = [
    {
      value: filterStatus,
      onChange: (e) => {
        setFilterStatus(e.target.value as FilterStatus);
        setPage(1);
      },
      options: [
        { label: "All", value: "all" },
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Banned", value: "banned" },
        { label: "Deleted", value: "deleted" },
      ],
      label: "Account Status",
    },
    {
      value: filterSub,
      onChange: (e) => {
        setFilterSub(e.target.value as FilterSub);
        setPage(1);
      },
      options: [
        { label: "All", value: "all" },
        { label: "Active", value: "active" },
        { label: "Expired", value: "expired" },
        { label: "Pending", value: "pending" },
        { label: "Cancelled", value: "cancelled" },
      ],
      label: "Subscription Status",
    },
  ];

  return (
    <div className="space-y-4">
      <CustomHeader
        isLoading={isLoading}
        refresh={refresh}
        onClick={handleOnClick}
        buttonLabel="Add Member"
        title="Member Management"
        description="Manage carreon gym members"
        icon={<Users color={COLORS.primary} />}
        hasAction={true}
      />

      {isAddModalOpen && (
        <AddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => refresh()}
          title="Create Account"
          subtitle="Create new member account"
          fields={fields}
          onSave={(data) => createAccount(data)}
          submitButtonText="Create Account"
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(({ label, value, color, icon }) => (
          <StatsCard key={label} label={label} value={value} color={color} icon={icon} />
        ))}
      </div>

      <div className="flex-1 bg-surface border border-border shadow-sm overflow-hidden min-w-0 w-full">
        <ToolBar
          placeholder="Search name, email, phone..."
          filtered={filtered}
          search={search}
          handleSearchChange={handleSearchChange}
          select={select}
        />

        <CustomTable
          renderRow={(m) => (
            <MemberRow
              key={m.id}
              m={m}
              onSetPlan={setSubscriptionMember}
              onSuspend={handleSuspend}
              onBan={handleBan}
              onDelete={handleDelete}
              onVerify={() => verifyAccount(m.id)}
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
            { label: "Member", key: "first_name", sortable: true },
            { label: "Status", key: "account_status", sortable: true },
            { label: "Plan", key: "plan_name", sortable: true },
            {
              label: "Subscription",
              key: "subscription_status",
              sortable: true,
            },
            { label: "Last Check-in", key: "last_check_in", sortable: true },
            {
              label: "Visits / mo",
              key: "total_visits_this_month",
              sortable: true,
            },
            { label: "", key: null },
          ]}
        />
      </div>

      {subscriptionMember && (
        <SubscriptionModal
          member={subscriptionMember}
          onClose={() => setSubscriptionMember(null)}
          onSuccess={refresh}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          isOpen={!!confirmDialog}
          onClose={confirmDialog.onClose}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
        />
      )}
    </div>
  );
}
