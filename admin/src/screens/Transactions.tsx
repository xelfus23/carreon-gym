import { useEffect, useMemo, useRef, useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { purchaseService } from "../services/purchase.service";
import ConfirmDialog from "../components/members/ConfirmDialog";
import {
  Search,
  Calendar,
  Receipt,
  CheckCircle,
  Clock,
  X,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  Ban,
  Trash2,
} from "lucide-react";

export default function TransactionsLog() {
  const { transactions, isLoading, formatDate, formatCurrency, refresh } =
    useTransactions();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null | undefined>();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    variant: "warning" | "danger";
    onConfirm: () => void;
  } | null>(null);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  const PAGE_SIZE = 50;

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedReceipt(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const stats = useMemo(() => {
    const paidOnly = transactions.filter((t) => t.status === "paid");
    const totalRevenue = paidOnly.reduce(
      (acc, curr) => acc + Number(curr.amount),
      0,
    );

    return {
      totalRevenue,
      pendingCount: transactions.filter((t) => t.status === "pending").length,
      avgOrder: paidOnly.length ? totalRevenue / paidOnly.length : 0,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (tx) =>
        tx.member_name.toLowerCase().includes(search.toLowerCase()) ||
        tx.item_name.toLowerCase().includes(search.toLowerCase()) ||
        tx.transaction_type.toLowerCase().includes(search.toLowerCase()),
    );
  }, [transactions, search]);

  const paginated = filteredTransactions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE) || 1;

  const handleVerify = async (paymentId: number) => {
    try {
      const result = await purchaseService.verifyPurchase(paymentId);
      if (!result?.success) {
        throw new Error(result?.message || "Failed to verify payment");
      }
      setOpenMenuId(null);
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeny = async (paymentId: number) => {
    try {
      const result = await purchaseService.denyPurchase(paymentId);
      if (!result?.success) {
        throw new Error(result?.message || "Failed to deny payment");
      }
      setOpenMenuId(null);
      setConfirmDialog(null);
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (paymentId: number) => {
    try {
      const result = await purchaseService.deleteTransaction(paymentId);
      if (!result?.success) {
        throw new Error(result?.message || "Failed to delete transaction");
      }
      setOpenMenuId(null);
      setConfirmDialog(null);
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!menuWrapRef.current) return;
      if (!menuWrapRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (isLoading)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-text-secondary animate-pulse">Loading financial records...</p>
      </div>
    );

  return (
    <div className="relative space-y-6 pb-10">
      {/* ── Enhanced Receipt Modal ── */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full bg-surface overflow-hidden shadow-2xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
              <h3 className="font-bold flex items-center gap-2">
                <Receipt size={18} className="text-primary" /> Payment Proof
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 hover:bg-border rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 bg-zinc-900 flex justify-center overflow-auto max-h-[70vh]">
              <img
                src={selectedReceipt}
                alt="Receipt"
                className="max-w-full h-auto shadow-lg object-contain"
              />
            </div>
            <div className="p-4 bg-surface border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-primary text-background font-bold text-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight">
            <Receipt className="text-primary" size={28} /> Payment Log
          </h1>
          <p className="text-text-secondary text-sm mt-1">Manage and verify Careon Gym transactions</p>
        </div>

        <button
          onClick={refresh}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-border bg-surface text-text-primary text-sm font-bold hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95 shadow-sm"
        >
          <RotateCcw size={16} />
          Refresh Data
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(stats.totalRevenue),
            color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
            icon: <CheckCircle size={16} />,
          },
          {
            label: "Pending Requests",
            value: stats.pendingCount,
            color: "border-amber-500/20 bg-amber-500/5 text-amber-500",
            icon: <Clock size={16} />,
          },
          {
            label: "Avg. Transaction",
            value: formatCurrency(stats.avgOrder),
            color: "border-blue-500/20 bg-blue-500/5 text-blue-500",
            icon: <Receipt size={16} />,
          },
        ].map(({ label, value, color, icon }) => (
          <div
            key={label}
            className={`p-5 border ${color} shadow-sm flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between opacity-80">
              <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
              {icon}
            </div>
            <p className="text-3xl font-black mt-2 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table Container ── */}
      <div
        ref={menuWrapRef}
        className="bg-surface border border-border shadow-sm overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-border bg-surface/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search member or item..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="px-3 py-1 bg-border/50">
            <span className="text-xs font-bold text-text-secondary">
              {filteredTransactions.length} RESULTS
            </span>
          </div>
        </div>

        <div className="overflow-x-auto h-[500px]">
          <table className="w-full border-collapse">
            <thead className=" sticky top-0">
              <tr className="bg-surface text-text-secondary font-bold text-[11px] uppercase tracking-wider border-b border-border">
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Member</th>
                <th className="px-6 py-4 text-left">Item / Plan</th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Amount</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Proof</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginated.map((tx) => (
                <tr key={tx.transaction_id} className="hover:bg-border/10 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-text-secondary group-hover:text-text-primary transition-colors">
                      <Calendar size={14} />
                      <span className="text-xs">{formatDate(tx.paid_at)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">{tx.member_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{tx.item_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-tighter ${tx.transaction_type === "plan"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-purple-500/10 text-purple-500"
                      }`}>
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-sm">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4">
                    {tx.status === "paid" ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 text-[11px] font-black">
                        <CheckCircle size={14} /> PAID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-500 text-[11px] font-black">
                        <Clock size={14} className="animate-pulse" /> PENDING
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {tx.receipt_image_url ? (
                      <button
                        onClick={() => setSelectedReceipt(tx.receipt_image_url)}
                        className="flex items-center gap-1 text-primary text-xs font-bold hover:opacity-70"
                      >
                        <ExternalLink size={12} /> View
                      </button>
                    ) : (
                      <span className="text-[10px] text-text-secondary uppercase">No Image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex">
                      <button
                        onClick={() =>
                          setOpenMenuId((prev) =>
                            prev === tx.transaction_id ? null : tx.transaction_id,
                          )
                        }
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-border/50 transition-colors"
                        aria-label="Transaction actions"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="8" cy="3" r="1.4" />
                          <circle cx="8" cy="8" r="1.4" />
                          <circle cx="8" cy="13" r="1.4" />
                        </svg>
                      </button>

                      {openMenuId === tx.transaction_id && (
                        <div className="absolute right-0 top-10 z-20 w-48 bg-surface border border-border shadow-xl overflow-hidden">
                          {tx.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleVerify(tx.transaction_id)}
                                className="w-full px-3 py-2 text-xs font-semibold text-left flex items-center gap-2 hover:bg-border/40 text-emerald-500"
                              >
                                <CheckCircle2 size={14} /> Verify payment
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmDialog({
                                    title: "Deny Payment Request",
                                    message: `Deny payment request for ${tx.member_name}?`,
                                    confirmLabel: "Deny Payment",
                                    variant: "warning",
                                    onConfirm: () => handleDeny(tx.transaction_id),
                                  })
                                }
                                className="w-full px-3 py-2 text-xs font-semibold text-left flex items-center gap-2 hover:bg-border/40 text-amber-500"
                              >
                                <Ban size={14} /> Deny payment
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                title: "Delete Transaction",
                                message: `Delete this transaction for ${tx.member_name}? This cannot be undone.`,
                                confirmLabel: "Delete",
                                variant: "danger",
                                onConfirm: () => handleDelete(tx.transaction_id),
                              })
                            }
                            className="w-full px-3 py-2 text-xs font-semibold text-left flex items-center gap-2 hover:bg-rose-500/10 text-rose-500 border-t border-border"
                          >
                            <Trash2 size={14} /> Delete transaction
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Modern Pagination Footer ── */}
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
                      className={`px-3 rounded-lg aspect-square text-xs font-semibold border transition-colors ${p === page
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
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => {
            setConfirmDialog(null);
            setOpenMenuId(null);
          }}
        />
      )}
    </div>
  );
}