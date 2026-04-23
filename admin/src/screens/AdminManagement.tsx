import { useMemo, useState } from "react";
import { useMember } from "../hooks/useMember";
import type { AdminMemberListItem } from "../types";
import { Search, Users } from "lucide-react";
import SubscriptionModal from "../components/SubscriptionModal";
import ConfirmDialog from "../components/members/ConfirmDialog";
import AdminRow from "../components/members/AdminRow";

type SortKey = keyof AdminMemberListItem | null;
type SortDir = "asc" | "desc";

export default function AdminManagement() {
  const { admins, refetch, isLoading, verifyMember } = useMember();
  const [subscriptionMember, setSubscriptionMember] =
    useState<AdminMemberListItem | null>(null);

  // Table controls
  const [search, setSearch] = useState("");
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
        refetch();
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
        refetch();
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
        refetch();
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

  // ── Table logic ───────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...admins];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          `${m.first_name} ${m.last_name}`
            .toLowerCase()
            .includes(q) ||
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

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      <span className="ml-1 text-text-secondary">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    ) : (
      <span className="ml-1 opacity-30 group-hover:opacity-60">↕</span>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-primary" /> Admin Management
        </h1>

        <div className="flex items-center gap-2 ml-auto">
          {!isLoading && (
            <button
              onClick={refetch}
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
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Table card ── */}
        <div className="flex-1 bg-surface border border-border shadow-sm overflow-hidden min-w-0">
          {/* Toolbar */}
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
                placeholder="Search name, email, phone…"
                className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-text-primary"
              />
            </div>

            <span className="ml-auto text-xs text-text-secondary font-medium whitespace-nowrap">
              {filtered.length} result
              {filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto h-[500px]">
            <table className="text-left text-sm w-full">
              <thead className="sticky top-0">
                <tr className="bg-surface text-text-primary font-bold uppercase tracking-wider border-b border-border">
                  {(
                    [
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
                    ] as { label: string; key: SortKey }[]
                  ).map(({ label, key }) => (
                    <th
                      key={label || "actions"}
                      onClick={() =>
                        key && handleSort(key)
                      }
                      className={`px-5 text-xs py-3.5 group ${key
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
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center text-text-secondary text-sm"
                    >
                      No members match your filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((m) => (
                    <AdminRow
                      key={m.id}
                      m={m}
                      onSetPlan={setSubscriptionMember}
                      onSuspend={handleSuspend}
                      onBan={handleBan}
                      onDelete={handleDelete}
                      onSendEmail={handleSendEmail}
                      onVerify={handleVerify}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {
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
                  className="px-3 py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border text-text-primary disabled:opacity-40 transition-colors"
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
                          ? "bg-primary text-background border-primary"
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
                  className="px-3 py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border text-text-primary disabled:opacity-40 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      {/* ── Modals ── */}
      {subscriptionMember && (
        <SubscriptionModal
          member={subscriptionMember}
          onClose={() => setSubscriptionMember(null)}
          onSuccess={refetch}
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
