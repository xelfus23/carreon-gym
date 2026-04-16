import { useMemo, useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { purchaseService } from "../services/purchase.service";
import {
    Search,
    // Wallet,
    Calendar,
    Receipt,
    CheckCircle,
    Clock,
} from "lucide-react";
// import toast from "react-hot-toast"; // Assuming you use react-hot-toast for feedback

export default function TransactionsLog() {
    const { transactions, isLoading, formatDate, formatCurrency, refresh } =
        useTransactions();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 50;

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        const paidOnly = transactions.filter((t) => t.status === "paid");
        const totalRevenue = paidOnly.reduce(
            (acc, curr) => acc + Number(curr.amount),
            0,
        );

        return {
            totalRevenue,
            pendingCount: transactions.filter((t) => t.status === "pending")
                .length,
            avgOrder: paidOnly.length ? totalRevenue / paidOnly.length : 0,
        };
    }, [transactions]);

    // --- Search Logic ---
    const filteredTransactions = useMemo(() => {
        return transactions.filter(
            (tx) =>
                tx.member_name.toLowerCase().includes(search.toLowerCase()) ||
                tx.item_name.toLowerCase().includes(search.toLowerCase()) ||
                tx.transaction_type
                    .toLowerCase()
                    .includes(search.toLowerCase()),
        );
    }, [transactions, search]);

    // --- Pagination Logic ---
    const paginated = filteredTransactions.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE,
    );
    const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE) || 1;

    // --- Admin Verification Handler ---
    const handleVerify = async (paymentId: number) => {
        try {
            await purchaseService.verifyPurchase(paymentId);
            // toast.success("Payment verified and stock updated!");
            refresh(); // Hook automatically refreshes via socket, but manual refresh is a safe fallback
        } catch (err) {
            // toast.error("Failed to verify payment. Check stock levels.");
            console.error(err);
        }
    };

    if (isLoading)
        return (
            <div className="p-8 text-center text-text-secondary">
                Loading financial records...
            </div>
        );

    return (
        <div className="space-y-6">
            {/* ── Stats bar ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    {
                        label: "Total Revenue",
                        value: formatCurrency(stats.totalRevenue),
                        color: "bg-emerald-600 text-emerald-50",
                    },
                    {
                        label: "Pending Requests",
                        value: stats.pendingCount,
                        color: "bg-amber-500 text-amber-50",
                    },
                    {
                        label: "Avg. Transaction",
                        value: formatCurrency(stats.avgOrder),
                        color: "bg-blue-500 text-blue-50",
                    },
                ].map(({ label, value, color }) => (
                    <div
                        key={label}
                        className={`px-4 py-3 ${color} rounded-sm shadow-sm`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                            {label}
                        </p>
                        <p className="text-2xl font-black mt-0.5">{value}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Receipt className="text-primary" /> Payment Log
                </h1>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={refresh}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary text-xs font-semibold uppercase tracking-wider hover:border-primary/40 hover:text-primary transition-all duration-150"
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
                </div>
            </div>

            {/* ── Main Table Card ── */}
            <div className="bg-surface border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-surface flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-48">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                            <Search size={14} />
                        </span>
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by member or product..."
                            className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none text-text-primary"
                        />
                    </div>
                    <span className="text-xs text-text-secondary font-medium">
                        {filteredTransactions.length} Transactions Found
                    </span>
                </div>

                <div className="overflow-x-auto h-160">
                    <table className="text-left text-sm w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-surface text-text-primary font-bold uppercase tracking-wider border-b border-border">
                                <th className="px-5 py-3.5 text-xs">Date</th>
                                <th className="px-5 py-3.5 text-xs">Member</th>
                                <th className="px-5 py-3.5 text-xs">
                                    Item / Plan
                                </th>
                                <th className="px-5 py-3.5 text-xs">Type</th>
                                <th className="px-5 py-3.5 text-xs">Amount</th>
                                <th className="px-5 py-3.5 text-xs">Status</th>
                                <th className="px-5 py-3.5 text-xs text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginated.map((tx) => (
                                <tr
                                    key={tx.transaction_id}
                                    className="hover:bg-border/30 transition-colors"
                                >
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar
                                                size={14}
                                                className="text-text-secondary"
                                            />
                                            <span className="font-medium">
                                                {formatDate(tx.paid_at)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-bold text-text-primary">
                                        {tx.member_name}
                                    </td>
                                    <td className="px-5 py-4">
                                        {tx.item_name}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                tx.transaction_type === "plan"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-purple-100 text-purple-700"
                                            }`}
                                        >
                                            {tx.transaction_type}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-mono font-bold text-text-primary">
                                        {formatCurrency(tx.amount)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5">
                                            {tx.status === "paid" ? (
                                                <span className="flex items-center gap-1 text-emerald-500 font-bold">
                                                    <CheckCircle size={14} />{" "}
                                                    PAID
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-amber-500 font-bold italic">
                                                    <Clock size={14} /> PENDING
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        {tx.status === "pending" && (
                                            <button
                                                onClick={() =>
                                                    handleVerify(
                                                        tx.transaction_id,
                                                    )
                                                }
                                                className="bg-primary text-background px-3 py-1 text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                                            >
                                                VERIFY PAID
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination Footer ── */}
                <div className="px-5 py-3 border-t border-border bg-surface/60 flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-border disabled:opacity-40"
                        >
                            ← Prev
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-border disabled:opacity-40"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
