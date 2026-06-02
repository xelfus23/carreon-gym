import { useMemo, useState } from "react";
import { useMember } from "../hooks/useMember";
import type { AdminMemberListItem, ConfirmDialogTypes } from "../types";
import { Loader2, UserRoundKey } from "lucide-react";
import SubscriptionModal from "../components/SubscriptionModal";
import AdminRow from "../components/TableRows/AdminRow";
import CustomHeader from "../components/CustomHeader";
import ToolBar from "../components/ToolBar";
import CustomTable from "../components/CustomTable";
import ConfirmDialog from "../components/Modals/ConfirmDialog";

type SortKey = keyof AdminMemberListItem | null;
type SortDir = "asc" | "desc";

export default function Admins() {
  const { admins, refresh, isLoading, verifyMember, deleteMember } = useMember();
  const [subscriptionMember, setSubscriptionMember] =
    useState<AdminMemberListItem | null>(null);

  // Table controls
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogTypes>(null);

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
      onClose: () => setConfirmDialog(null)
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
      onClose: () => setConfirmDialog(null)

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
        console.log("delete", m.id);
        deleteMember(m.id)
        refresh();
      },
      onClose: () => setConfirmDialog(null)
    });
  };

  const handleSendEmail = (m: AdminMemberListItem) => {
    // TODO: open email composer modal
    alert(`Sending email to ${m.email}…`);
  };

  const handleVerify = async (m: AdminMemberListItem) => {
    verifyMember(m.id);
  };

  // ── Table logic ───────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...admins];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.phone_number?.includes(q),
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
  }, [admins, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (isLoading)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Loader2
          size={26}
          className="animate-spin text-primary stroke-primary"
        />
        <p className="text-text-secondary animate-pulse">
          Loading admin records...
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      <CustomHeader
        title="Admin Management"
        description="Manage carreon gym admins"
        isLoading={isLoading}
        icon={<UserRoundKey className="text-primary" />}
        refresh={refresh}
        hasAction={false}
      />

      {/* ── Main layout ── */}
      {/* ── Table card ── */}
      <div className="flex-1 bg-surface border border-border shadow-sm overflow-hidden min-w-0">
        {/* Toolbar */}
        <ToolBar
          search={search}
          handleSearchChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          filtered={filtered}
          placeholder="Search name, email, phone..."
        />

        <CustomTable<AdminMemberListItem>
          columns={[
            {
              label: "ID",
              key: "id",
            },
            {
              label: "Name",
              key: "first_name",
            },
            {
              label: "Status",
              key: "account_status",
            },

            {
              label: "Last Check-in",
              key: "last_check_in",
            },
            { label: "", key: null },
          ]}
          onSort={handleSort}
          data={paginated}
          totalItems={totalPages}
          setPage={setPage}
          page={page}
          pageSize={PAGE_SIZE}
          renderRow={(admin) => (
            <AdminRow
              m={admin}
              onBan={handleBan}
              onDelete={handleDelete}
              onSendEmail={handleSendEmail}
              onSuspend={handleSuspend}
              onVerify={handleVerify}
            />
          )}
        />
      </div>

      {/* ── Modals ── */}
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
          variant="danger"
          isLoading={false}
        />
      )}
    </div>
  );
}
