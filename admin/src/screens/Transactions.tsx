import { useEffect, useMemo, useRef, useState } from "react";
import { useTransactions, type TransactionProps } from "../hooks/useTransactions";
import { purchaseService } from "../services/purchase.service";
import ConfirmDialog from "../components/members/ConfirmDialog";
import {
  Receipt,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import StatsCard from "../components/CustomStatsCard";
import CustomHeader from "../components/CustomHeader";
import CustomTable from "../components/CustomTable";
import TransactionRow from "../components/TransactionRow";
import { formatCurrency } from "../utils/formatCurrency";
import ToolBar from "../components/ToolBar";

export default function TransactionsLog() {
  const { transactions, isLoading, refresh } =
    useTransactions();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<
    string | null | undefined
  >();
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
          <StatsCard {...props} />
        ))}
      </div>

      {/* ── Table Container ── */}
      <div
        ref={menuWrapRef}
        className="bg-surface border border-border shadow-sm overflow-hidden flex flex-col"
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
          columns={[
            { label: "Transaction ID", key: "transaction_id" },
            { label: "Reference No.", key: "reference_no" },
            { label: "Date", key: "paid_at"},
            { label: "Member", key: "member_name" },
            { label: "Item", key: "item_name" },
            { label: "Type", key: "transaction_type" },
            { label: "Amount", key: "amount" },
            { label: "Status", key: "status" },
            { label: "Proof", key: "receipt_image_url" },
            { label: "", key: null }
          ]}
          data={paginated}
          totalItems={totalPages}
          setPage={setPage}
          page={page}
          pageSize={PAGE_SIZE}
          renderRow={(tr) =>

            <TransactionRow
              setOpenMenuId={setOpenMenuId}
              setSelectedReceipt={setSelectedReceipt}
              openMenuId={openMenuId}
              tx={tr}
              OnVerify={() => handleVerify(tr.transaction_id)}
              OnDelete={() =>
                setConfirmDialog({
                  title: "Delete Transaction",
                  message: `Delete this transaction for ${tr.member_name}? This cannot be undone.`,
                  confirmLabel: "Delete",
                  variant: "danger",
                  onConfirm: () =>
                    handleDelete(tr.transaction_id),
                })}
              OnDeny={() => setConfirmDialog({
                title: "Deny Payment Request",
                message: `Deny payment request for ${tr.member_name}?`,
                confirmLabel: "Deny Payment",
                variant: "warning",
                onConfirm: () =>
                  handleDeny(tr.transaction_id),
              })}
            />
          }
        />

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
