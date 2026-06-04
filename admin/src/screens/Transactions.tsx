import { useEffect, useMemo, useRef, useState } from "react";
import {
  useTransactions,
  type TransactionProps,
} from "../hooks/useTransactions";
import { purchaseService } from "../services/purchase.service";
import { Receipt, CheckCircle, Clock, X } from "lucide-react";
import StatsCard from "../components/CustomStatsCard";
import CustomHeader from "../components/CustomHeader";
import CustomTable, { type ColumnDefinition } from "../components/CustomTable";
import TransactionRow from "../components/TableRows/TransactionRow";
import { formatCurrency } from "../utils/formatCurrency";
import ToolBar from "../components/ToolBar";
import ConfirmDialog from "../components/Modals/ConfirmDialog";
import type { ConfirmDialogTypes } from "../types";

export default function Transactions() {
  const { transactions, isLoading, refresh } = useTransactions();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<
    string | null | undefined
  >();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogTypes>(null);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  const PAGE_SIZE = 50;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedReceipt(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;

    for (const t of transactions) {
      if (t.status === "paid") {
        totalRevenue += Number(t.amount);
        paidCount++;
      } else if (t.status === "pending") {
        pendingCount++;
      }
    }

    return {
      totalRevenue,
      pendingCount,
      avgOrder: paidCount ? totalRevenue / paidCount : 0,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const q = search.toLowerCase();

    if (!q) return transactions;

    return transactions.filter((tx) => {
      return (
        tx.member_name.toLowerCase().includes(q) ||
        tx.item_name.toLowerCase().includes(q) ||
        tx.transaction_type.toLowerCase().includes(q)
      );
    });
  }, [transactions, search]);

  const paginated = filteredTransactions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE) || 1;


  const onAccept = (t: TransactionProps) => {
    setConfirmDialog({
      title: "Verify Transaction",
      message: `Requested by ${t.member_name} with amount of ${t.amount}? This action cannot be undone.`,
      confirmLabel: "Verify",
      variant: "success",
      onConfirm: async () => {
        setConfirmDialog(null);
        await purchaseService.verifyPurchase(t.transaction_id);
        refresh();
      },
      onClose: () => setConfirmDialog(null),
    })
  }

  const onDeny = (t: TransactionProps) => {
    setConfirmDialog({
      title: "Deny Transaction",
      message: `Requested ${t.member_name} with amount of ${t.amount}? This action cannot be undone.`,
      confirmLabel: "Deny",
      variant: "warning",
      onConfirm: async () => {
        setConfirmDialog(null);
        await purchaseService.denyPurchase(t.transaction_id);
        refresh();
      },
      onClose: () => setConfirmDialog(null),
    })
  }

  const onDelete = (t: TransactionProps) => {
    setConfirmDialog({
      title: "Delete Transaction",
      message: `Requested by ${t.member_name} with amount of ${t.amount}? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        await purchaseService.deleteTransaction(t.transaction_id);
        refresh();
      },
      onClose: () => setConfirmDialog(null),
    })
  }


  const columns: ColumnDefinition<TransactionProps>[] = useMemo(
    () => [
      { label: "Ref. No.", key: "reference_no" },
      { label: "Date", key: "paid_at" },
      { label: "Member", key: "member_name" },
      { label: "Item", key: "item_name" },
      { label: "Amount", key: "amount" },
      { label: "Status", key: "status" },
      { label: "Proof", key: "receipt_image_url" },
      { label: "", key: null },
    ],
    [],
  );

  if (isLoading)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-text-secondary animate-pulse">
          Loading financial records...
        </p>
      </div>
    );

  const cards = [
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
  ];

  return (
    <div className="space-y-4">
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

      <CustomHeader
        title="Payment Log"
        description="Manage and verify carreon gym transactions"
        refresh={refresh}
        hasAction={false}
        icon={<Receipt className="text-primary" />}
        isLoading={isLoading}
      />

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((props) => (
          <StatsCard key={props.label} {...props} />
        ))}
      </div>

      {/* ── Table Container ── */}
      <div
        ref={menuWrapRef}
        className="bg-surface border border-border shadow-sm flex flex-col"
      >
        <ToolBar
          filtered={filteredTransactions}
          search={search}
          handleSearchChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search transactions"
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
