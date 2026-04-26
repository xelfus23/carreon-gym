import { type FormEvent, useMemo, useState } from "react";
import { useMember } from "../hooks/useMember";
import type { AdminMemberListItem } from "../types";
import MemberRow from "../components/TableRows/MemberRow";
import ConfirmDialog from "../components/ConfirmDialog";
import SubscriptionModal from "../components/SubscriptionModal";
import { memberService } from "../services/member.service";
import {
  Calendar,
  CircleAlert,
  CircleCheck,
  Loader2,
  Star,
  Users,
} from "lucide-react";
import CustomTable from "../components/CustomTable";
import CustomHeader from "../components/CustomHeader";
import StatsCard from "../components/CustomStatsCard";
import { COLORS } from "../constants";
import type { SelectProps } from "../components/ToolBar";
import ToolBar from "../components/ToolBar";

export type SortKey = keyof AdminMemberListItem | null;
export type SortDir = "asc" | "desc";
export type FilterStatus = "all" | "active" | "suspended" | "deleted";
export type FilterSub = "all" | "active" | "expired" | "pending" | "cancelled";

export default function MemberManagement() {
  const { members, refresh, isLoading, verifyMember } = useMember();
  const [subscriptionMember, setSubscriptionMember] =
    useState<AdminMemberListItem | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  // Table controls
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterSub, setFilterSub] = useState<FilterSub>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    variant: "warning" | "danger";
    onConfirm: () => void;
  } | null>(null);

  // ── Action handlers ────────────────────────────────────────────────────

  const handleSuspend = (m: AdminMemberListItem) => {
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
        // TODO: call memberService.suspend(m.id, !isSuspended)
        console.log("suspend/unsuspend", m.id);
        refresh();
      },
    });
  };

  const handleBan = (m: AdminMemberListItem) => {
    setConfirmDialog({
      title: "Ban / Blacklist Member",
      message: `Permanently ban ${m.first_name} ${m.last_name}? This will cancel their subscription and block future access.`,
      confirmLabel: "Ban Member",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        // TODO: call memberService.ban(m.id)
        console.log("ban", m.id);
        refresh();
      },
    });
  };

  const handleDelete = (m: AdminMemberListItem) => {
    setConfirmDialog({
      title: "Delete Member",
      message: `Permanently delete ${m.first_name} ${m.last_name}'s account? This action cannot be undone and will remove all their data.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        // TODO: call memberService.delete(m.id)
        console.log("delete", m.id);
        refresh();
      },
    });
  };

  const handleSendEmail = (m: AdminMemberListItem) => {
    // TODO: open email composer modal
    alert(`Sending email to ${m.email}…`);
  };

  const handleVerify = async (m: AdminMemberListItem) => {
    verifyMember(m.id);
  };

  const handleCreateMember = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddMemberError(null);
    setAddMemberSuccess(null);

    setIsSubmittingMember(true);
    try {
      await memberService.createMember(newMember);
      setAddMemberSuccess("Member created successfully.");
      setNewMember({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
      });
      setIsAddMemberOpen(false);
      refresh();
    } catch (err) {
      if (err instanceof Error) {
        setAddMemberError(err.message);
      } else {
        setAddMemberError("Failed to create member.");
      }
    } finally {
      setIsSubmittingMember(false);
    }
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
    setAddMemberError(null);
    setAddMemberSuccess(null);
    setIsAddMemberOpen((v) => !v);
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
    {
      label: "Avg Attendance",
      value: `${stats.avgAttendance}%`,
      color: "border-violet-500/30 bg-violet-500/5 text-violet-500",
      icon: <Calendar size={16} />,
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
        { label: "All Accounts", value: "all" },
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Deleted", value: "deleted" },
      ],
    },
    {
      value: filterSub,
      onChange: (e) => {
        setFilterSub(e.target.value as FilterSub);
        setPage(1);
      },
      options: [
        { label: "All Plans", value: "all" },
        { label: "Active Plan", value: "active" },
        { label: "Expired", value: "expired" },
        { label: "Pending", value: "pending" },
        { label: "Cancelled", value: "cancelled" },
      ],
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

      {isAddMemberOpen && (
        <form
          onSubmit={handleCreateMember}
          className="border border-border bg-surface p-4 grid grid-cols-1 md:grid-cols-5 gap-3"
        >
          <input
            required
            value={newMember.firstName}
            onChange={(e) =>
              setNewMember((prev) => ({ ...prev, firstName: e.target.value }))
            }
            placeholder="First name"
            className="px-3 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <input
            required
            value={newMember.lastName}
            onChange={(e) =>
              setNewMember((prev) => ({ ...prev, lastName: e.target.value }))
            }
            placeholder="Last name"
            className="px-3 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <input
            required
            type="email"
            value={newMember.email}
            onChange={(e) =>
              setNewMember((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Email"
            className="px-3 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <input
            required
            value={newMember.phoneNumber}
            onChange={(e) =>
              setNewMember((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            placeholder="Contact number"
            className="px-3 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <input
            required
            type="password"
            minLength={8}
            value={newMember.password}
            onChange={(e) =>
              setNewMember((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Password"
            className="px-3 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
          />

          <div className="md:col-span-5 flex items-center justify-between gap-3">
            <div className="text-xs">
              {addMemberError && (
                <span className="text-rose-500">{addMemberError}</span>
              )}
              {!addMemberError && addMemberSuccess && (
                <span className="text-emerald-500">{addMemberSuccess}</span>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmittingMember}
              className="px-4 py-2 bg-primary text-background text-sm font-semibold disabled:opacity-50"
            >
              {isSubmittingMember ? "Adding..." : "Create Member"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {cards.map(({ label, value, color, icon }) => (
          <StatsCard label={label} value={value} color={color} icon={icon} />
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
              onSendEmail={handleSendEmail}
              onVerify={handleVerify}
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
            { label: "Attendance", key: "attendance_rate", sortable: true },
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
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
