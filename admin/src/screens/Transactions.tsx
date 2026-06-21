import { useEffect, useMemo, useRef, useState } from "react";
import {
  useTransactions,
  type TransactionProps,
} from "../hooks/useTransactions";
import { purchaseService } from "../services/purchase.service";
import {
  Receipt,
  CheckCircle,
  Clock,
  X,
  TrendingUp,
  ImageOff,
} from "lucide-react";
import StatsCard from "../components/CustomStatsCard";
import CustomTable, { type ColumnDefinition } from "../components/CustomTable";
import TransactionRow from "../components/TableRows/TransactionRow";
import { formatCurrency } from "../utils/formatCurrency";
import ToolBar from "../components/ToolBar";
import ConfirmDialog from "../components/Modals/ConfirmDialog";
import type { ConfirmDialogTypes } from "../types";
import LogTransactionModal from "../components/Modals/LogTransactionModal";
import { useMember } from "../hooks/useMember";

export default function Transactions() {
  const { transactions, isLoading, refresh, logManualTransaction } =
    useTransactions();
  const { members } = useMember();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<
    string | null | undefined
  >();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogTypes>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  const PAGE_SIZE = 50;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedReceipt(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let refundedCount = 0;

    for (const t of transactions) {
      if (t.status === "paid") {
        totalRevenue += Number(t.amount);
        paidCount++;
      } else if (t.status === "pending") {
        pendingCount++;
      } else if (t.status === "refunded") {
        refundedCount++;
      }
    }

    return {
      totalRevenue,
      paidCount,
      pendingCount,
      refundedCount,
      avgOrder: paidCount ? totalRevenue / paidCount : 0,
    };
  }, [transactions]);

  // ── Filtering ────────────────────────────────────────────────────────────

  const filteredTransactions = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (tx) =>
        tx.member_name.toLowerCase().includes(q) ||
        tx.transaction_type.toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const paginated = filteredTransactions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE) || 1;

  // ── Actions ──────────────────────────────────────────────────────────────

  const onAccept = (t: TransactionProps) => {
    setConfirmDialog({
      title: "Verify payment",
      message: `Mark ${formatCurrency(Number(t.amount))} from ${t.member_name} as paid? This cannot be undone.`,
      confirmLabel: "Verify",
      variant: "success",
      onConfirm: async () => {
        setConfirmDialog(null);
        await purchaseService.verifyPurchase(t.transaction_id);
        refresh();
      },
      onClose: () => setConfirmDialog(null),
    });
  };

  const onDeny = (t: TransactionProps) => {
    setConfirmDialog({
      title: "Deny payment",
      message: `Deny ${formatCurrency(Number(t.amount))} from ${t.member_name}? This cannot be undone.`,
      confirmLabel: "Deny",
      variant: "warning",
      onConfirm: async () => {
        setConfirmDialog(null);
        await purchaseService.denyPurchase(t.transaction_id);
        refresh();
      },
      onClose: () => setConfirmDialog(null),
    });
  };

  const onDelete = (t: TransactionProps) => {
    setConfirmDialog({
      title: "Delete transaction",
      message: `Permanently delete ${formatCurrency(Number(t.amount))} from ${t.member_name}? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        await purchaseService.deleteTransaction(t.transaction_id);
        refresh();
      },
      onClose: () => setConfirmDialog(null),
    });
  };

  // ── Table columns ────────────────────────────────────────────────────────

  const columns: ColumnDefinition<TransactionProps>[] = useMemo(
    () => [
      { label: "Ref. no.", key: "reference_no" },
      { label: "Date", key: "paid_at" },
      { label: "Member", key: "member_name" },
      { label: "Item", key: "items" },
      { label: "Amount", key: "amount" },
      { label: "Status", key: "status" },
      { label: "Method", key: "method" },
      { label: "Proof", key: "receipt_image_url" },
      { label: "", key: null },
    ],
    [],
  );

  const cards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
      icon: <CheckCircle size={16} />,
    },
    {
      label: "Avg. Transaction",
      value: formatCurrency(stats.avgOrder),
      color: "border-blue-500/20 bg-blue-500/5 text-blue-500",
      icon: <TrendingUp size={16} />,
    },
    {
      label: "Pending",
      value: stats.pendingCount,
      color: "border-amber-500/20 bg-amber-500/5 text-amber-500",
      icon: <Clock size={16} />,
    },
    {
      label: "Paid",
      value: stats.paidCount,
      color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
      icon: <CheckCircle size={16} />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Receipt preview modal ── */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="relative w-full max-w-lg bg-surface border border-border shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Receipt size={15} className="text-primary" />
                <span className="text-sm font-bold text-text-primary">
                  Payment proof
                </span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            {/* Image */}
            <div className="bg-black/40 flex items-center justify-center min-h-64 max-h-[65vh] overflow-auto p-4">
              {selectedReceipt ? (
                <img
                  src={selectedReceipt}
                  alt="Payment receipt"
                  className="max-w-full h-auto object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-secondary py-8">
                  <ImageOff size={24} />
                  <p className="text-xs">Image unavailable</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-1.5 bg-primary hover:bg-primary/90 transition-colors text-background text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((props) => (
          <StatsCard key={props.label} {...props} />
        ))}
      </div>

      {/* ── Transactions table ── */}
      <div
        ref={menuWrapRef}
        className="bg-surface border border-border shadow-sm"
      >
        <ToolBar
          action={{
            label: "New Transaction",
            function: () => setIsModalOpen(true),
            loading: isLoading
          }}
          search={search}
          handleSearchChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by member name or type…"
        />

        <CustomTable<TransactionProps>
          columns={columns}
          data={paginated}
          totalItems={totalPages}
          setPage={setPage}
          page={page}
          pageSize={PAGE_SIZE}
          renderRow={(tr) => (
            <TransactionRow
              key={tr.transaction_id}
              setSelectedReceipt={setSelectedReceipt}
              tx={tr}
              onAccept={onAccept}
              onDelete={onDelete}
              onDeny={onDeny}
            />
          )}
        />
      </div>

      {/* ── Modals ── */}
      {isModalOpen && (
        <LogTransactionModal
          members={members}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data) => logManualTransaction(data)}
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
