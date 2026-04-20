import { useMemo, useState } from "react";
import { formatAttemptReason, useAttendanceLog } from "../hooks/useAttendance";
import { Search, Clock, Calendar, Logs, Plus } from "lucide-react";

export default function AttendanceLog() {
    const {
        logs,
        attempts,
        isLoading,
        formatDate,
        formatTime,
        refresh,
        latestFailureAlert,
        clearFailureAlert,
    } = useAttendanceLog();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 50;

    // --- Helper Function to Format Duration ---
    const formatDuration = (totalMinutes: number) => {
        if (!totalMinutes || totalMinutes <= 0) return "--";

        let seconds = Math.floor(totalMinutes * 60);

        const days = Math.floor(seconds / (24 * 3600));
        seconds %= 24 * 3600;
        const hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        const parts = [];
        if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
        if (minutes > 0)
            parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
        if (secs > 0 || parts.length === 0)
            parts.push(`${secs} second${secs !== 1 ? "s" : ""}`);

        return parts.join(", ");
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(
            (log) =>
                `${log.first_name} ${log.last_name}`
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                log.method.toLowerCase().includes(search.toLowerCase()),
        );
    }, [logs, search]);

    const failedAttempts = useMemo(
        () => attempts.filter((attempt) => attempt.result === "failed"),
        [attempts],
    );

    const stats = useMemo(
        () => ({
            total: logs.length,
            activeNow: logs.filter((l) => l.status === "checked_in").length,
            avgDuration: logs.length
                ? logs.reduce((acc, curr) => acc + (curr.duration || 0), 0) /
                  logs.length
                : 0,
        }),
        [logs],
    );

    const paginated = filteredLogs.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE,
    );
    const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;

    if (isLoading)
        return (
            <div className="p-8 text-center text-text-secondary">
                Loading logs...
            </div>
        );

    return (
        <div className="space-y-6">
            {/* ── Stats bar ── */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: "Total Visits",
                        value: stats.total,
                        color: "bg-slate-500 text-slate-50",
                    },
                    {
                        label: "Currently In",
                        value: stats.activeNow,
                        color: "bg-emerald-500 text-emerald-50",
                    },
                    {
                        label: "Avg Session",
                        // Using the formatter for the stats bar too
                        value: formatDuration(stats.avgDuration),
                        color: "bg-indigo-500 text-indigo-50",
                    },
                    {
                        label: "Error Log",
                        value: failedAttempts.length,
                        color: "bg-red-400 text-white",
                    },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`px-4 py-3 ${color} shadow-sm`}>
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                            {label}
                        </p>
                        <p
                            className={`${typeof value === "string" && value.length > 15 ? "text-lg" : "text-2xl"} font-black mt-0.5 transition-all`}
                        >
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Logs className="text-primary" /> Attendance Log
                </h1>

                <div className="flex items-center gap-2 ml-auto">
                    {!isLoading && (
                        <button
                            onClick={() => refresh(false)}
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
                    <button
                        // onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-background hover:opacity-90 transition-all text-sm font-medium"
                    >
                        <Plus size={16} /> Add Log
                    </button>
                </div>
            </div>

            {latestFailureAlert && (
                <div className="px-4 py-3 border border-rose-300 bg-rose-50 text-rose-700 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                        Failed {latestFailureAlert.action.replace("_", " ")}{" "}
                        scan detected: {latestFailureAlert.last_name} (
                        {formatAttemptReason(latestFailureAlert.reason)})
                    </p>
                    <button
                        onClick={clearFailureAlert}
                        className="text-xs font-bold uppercase tracking-wide hover:opacity-80"
                    >
                        Dismiss
                    </button>
                </div>
            )}

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
                            placeholder="Search member name..."
                            className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none text-text-primary"
                        />
                    </div>
                    <span className="text-xs text-text-secondary font-medium">
                        {filteredLogs.length} Records Found
                    </span>
                </div>

                <div className="overflow-x-auto h-160">
                    <table className="text-left text-sm w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-surface text-text-primary font-bold uppercase tracking-wider border-b border-border">
                                <th className="px-5 py-3.5 text-xs">Date</th>
                                <th className="px-5 py-3.5 text-xs">Member</th>
                                <th className="px-5 py-3.5 text-xs">
                                    Check In
                                </th>
                                <th className="px-5 py-3.5 text-xs">
                                    Check Out
                                </th>
                                <th className="px-5 py-3.5 text-xs">
                                    Duration
                                </th>
                                <th className="px-5 py-3.5 text-xs">Method</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginated.map((log) => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-border/30 transition-colors"
                                >
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar
                                                size={14}
                                                className="text-text-secondary"
                                            />
                                            <span className="font-medium">
                                                {formatDate(log.check_in_time)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-bold text-text-primary">
                                        {log.first_name} {log.last_name}
                                    </td>
                                    <td className="px-5 py-4 text-emerald-500 font-medium">
                                        {formatTime(log.check_in_time)}
                                    </td>
                                    <td className="px-5 py-4 text-rose-500 font-medium">
                                        {log.check_out_time ? (
                                            formatTime(log.check_out_time)
                                        ) : (
                                            <span className="flex items-center gap-1 opacity-50 italic">
                                                <Clock size={12} /> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap font-mono text-xs">
                                        {/* Applied the new formatter here */}
                                        {formatDuration(log.duration!)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase">
                                            {log.method}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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

            <div className="bg-surface border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-surface">
                    <h2 className="text-lg font-bold text-rose-600">
                        Error Log
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">
                        Shows failed QR scans like no subscription, invalid QR,
                        or duplicate check-in.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="text-left text-sm w-full">
                        <thead>
                            <tr className="bg-surface text-text-primary font-bold uppercase tracking-wider border-b border-border">
                                <th className="px-5 py-3.5 text-xs">Time</th>
                                <th className="px-5 py-3.5 text-xs">Member</th>
                                <th className="px-5 py-3.5 text-xs">Action</th>
                                <th className="px-5 py-3.5 text-xs">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {failedAttempts.slice(0, 50).map((attempt) => (
                                <tr
                                    key={attempt.id}
                                    className="hover:bg-border/30 transition-colors"
                                >
                                    <td className="px-5 py-4 whitespace-nowrap font-medium">
                                        {formatDate(attempt.created_at)}{" "}
                                        {formatTime(attempt.created_at)}
                                    </td>
                                    <td className="px-5 py-4 font-bold text-text-primary">
                                        {attempt.first_name} {attempt.last_name}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
                                            {attempt.action.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-rose-600 font-semibold">
                                        {formatAttemptReason(attempt.reason)}
                                    </td>
                                </tr>
                            ))}
                            {failedAttempts.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-5 py-6 text-center text-text-secondary"
                                    >
                                        No failed attendance attempts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
