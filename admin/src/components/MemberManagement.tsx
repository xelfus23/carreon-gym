import React, { useState, useMemo } from "react";
import { chatService } from "../services/AIService";
import type { AdminMemberListItem } from "../types";
import { useMember } from "../hooks/useMember";
import MemberRow from "./members/MemberRow";

type SortKey = keyof AdminMemberListItem | null;
type SortDir = "asc" | "desc";
type FilterStatus = "all" | "active" | "suspended" | "deleted";
type FilterSub = "all" | "active" | "expired" | "pending" | "cancelled";

const MemberManagement: React.FC = () => {
    const { members } = useMember();

    // Selection & AI
    const [selectedMember, setSelectedMember] =
        useState<AdminMemberListItem | null>(null);
    const [insight, setInsight] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentState, setCurrentState] = useState("");

    // Table controls
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [filterSub, setFilterSub] = useState<FilterSub>("all");
    const [sortKey, setSortKey] = useState<SortKey>("created_at");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    // Derived list
    const filtered = useMemo(() => {
        let list = [...members];

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
            suspended: members.filter((m) => m.account_status === "suspended")
                .length,
            activeSubs: members.filter(
                (m) => m.subscription_status === "active",
            ).length,
            avgAttendance: members.length
                ? Math.round(
                      members.reduce((s, m) => s + m.attendance_rate, 0) /
                          members.length,
                  )
                : 0,
        }),
        [members],
    );

    const fetchInsight = async (member: AdminMemberListItem) => {
        setSelectedMember(member);
        setIsLoading(true);
        setInsight("");
        setCurrentState("Initializing session...");

        try {
            const session = await chatService.createChat();
            const lastSeen = member.last_check_in
                ? new Date(member.last_check_in).toLocaleDateString()
                : "unknown";
            const prompt =
                `Provide a quick summary and 3 motivational tips for a gym member named ` +
                `${member.first_name} ${member.last_name} who has a ${member.plan_name ?? "standard"} plan. ` +
                `Attendance rate: ${member.attendance_rate}%. Last check-in: ${lastSeen}. ` +
                `Total visits this month: ${member.total_visits_this_month ?? 0}. ` +
                `Keep it professional and encouraging.`;

            await chatService.sendMessage(
                session.id,
                prompt,
                (token) => setInsight((prev) => prev + token),
                (state) => setCurrentState(state),
            );
        } catch (error) {
            console.error("Insight Error:", error);
            setInsight(
                "Failed to connect to the AI service. Ensure the server is running.",
            );
        } finally {
            setIsLoading(false);
            setCurrentState("");
        }
    };

    const SortIcon = ({ col }: { col: SortKey }) =>
        sortKey === col ? (
            <span className="ml-1 text-text-secondary">
                {sortDir === "asc" ? "↑" : "↓"}
            </span>
        ) : (
            <span className="ml-1 text-text-secondary group-hover:text-text-secondary">
                ↕
            </span>
        );

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* ── Stats bar ── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    {
                        label: "Total Members",
                        value: stats.total,
                        color: "bg-slate-500 text-slate-50",
                    },
                    {
                        label: "Active Accounts",
                        value: stats.active,
                        color: "bg-emerald-500 text-emerald-50",
                    },
                    {
                        label: "Suspended",
                        value: stats.suspended,
                        color: "bg-amber-500 text-amber-50",
                    },
                    {
                        label: "Active Subs",
                        value: stats.activeSubs,
                        color: "bg-indigo-500 text-indigo-50",
                    },
                    {
                        label: "Avg Attendance",
                        value: `${stats.avgAttendance}%`,
                        color: "bg-violet-500 text-violet-50",
                    },
                ].map(({ label, value, color }) => (
                    <div
                        key={label}
                        className={`rounded-2xl px-4 py-3 ${color}`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                            {label}
                        </p>
                        <p className="text-2xl font-black mt-0.5">{value}</p>
                    </div>
                ))}
            </div>

            {/* ── Main layout ── */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* ── Table card ── */}
                <div className="flex-1 bg-surface rounded-3xl border border-border shadow-sm overflow-hidden min-w-0">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-border bg-surface flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-48">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                                🔍
                            </span>
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                type="text"
                                placeholder="Search name, email, phone…"
                                className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        {/* Account status filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value as FilterStatus);
                                setPage(1);
                            }}
                            className="px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="all">All Accounts</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="deleted">Deleted</option>
                        </select>

                        {/* Subscription filter */}
                        <select
                            value={filterSub}
                            onChange={(e) => {
                                setFilterSub(e.target.value as FilterSub);
                                setPage(1);
                            }}
                            className="px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="all">All Plans</option>
                            <option value="active">Active Plan</option>
                            <option value="expired">Expired</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <span className="ml-auto text-xs text-text-secondary font-medium whitespace-nowrap">
                            {filtered.length} result
                            {filtered.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-surface text-text-primary text-[11px] font-bold uppercase tracking-wider border-b border-border">
                                    {(
                                        [
                                            {
                                                label: "Member",
                                                key: "first_name",
                                            },
                                            {
                                                label: "Status",
                                                key: "account_status",
                                            },
                                            { label: "Plan", key: "plan_name" },
                                            {
                                                label: "Subscription",
                                                key: "subscription_status",
                                            },
                                            {
                                                label: "Last Check-in",
                                                key: "last_check_in",
                                            },
                                            {
                                                label: "Visits / mo",
                                                key: "total_visits_this_month",
                                            },
                                            {
                                                label: "Attendance",
                                                key: "attendance_rate",
                                            },
                                            { label: "", key: null },
                                        ] as { label: string; key: SortKey }[]
                                    ).map(({ label, key }) => (
                                        <th
                                            key={label || "actions"}
                                            onClick={() =>
                                                key && handleSort(key)
                                            }
                                            className={`px-5 py-3.5 group ${key ? "cursor-pointer select-none hover:text-text-secondary" : ""}`}
                                        >
                                            {label}
                                            {key && <SortIcon col={key} />}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-16 text-center text-slate-400 text-sm"
                                        >
                                            No members match your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((m) => (
                                        <MemberRow
                                            key={m.id}
                                            m={m}
                                            isLoading={isLoading}
                                            isSelected={
                                                selectedMember?.id === m.id
                                            }
                                            fetchInsight={fetchInsight}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
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
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                                    p === page
                                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
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
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── AI Insight panel ── */}
                <div className="lg:w-80 space-y-4 shrink-0">
                    <div className="bg-linear-to-br from-primary-dark to-primary-dark/20 rounded-3xl p-6 text-white">
                        <h4 className="text-base font-bold mb-4 flex items-center gap-2">
                            <span className="text-lg">✨</span> Member Coach AI
                        </h4>

                        {selectedMember ? (
                            <div className="space-y-4">
                                {/* Member mini-card */}
                                <div className="pb-4 border-b border-white/20">
                                    <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mb-1">
                                        Analysing
                                    </p>
                                    <p className="text-lg font-black leading-tight">
                                        {selectedMember.first_name}{" "}
                                        {selectedMember.last_name}
                                    </p>
                                    <p className="text-xs text-indigo-300 mt-0.5">
                                        {selectedMember.email}
                                    </p>

                                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                        {[
                                            {
                                                label: "Plan",
                                                val:
                                                    selectedMember.plan_name ??
                                                    "—",
                                            },
                                            {
                                                label: "Visits",
                                                val:
                                                    selectedMember.total_visits_this_month ??
                                                    0,
                                            },
                                            {
                                                label: "Attendance",
                                                val: `${selectedMember.attendance_rate}%`,
                                            },
                                        ].map(({ label, val }) => (
                                            <div
                                                key={label}
                                                className="bg-white/10 rounded-xl p-2"
                                            >
                                                <p className="text-[9px] text-indigo-200 uppercase font-bold">
                                                    {label}
                                                </p>
                                                <p className="text-sm font-black truncate">
                                                    {val}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* AI output */}
                                <div className="text-sm leading-relaxed text-indigo-50 bg-black/20 p-4 rounded-2xl min-h-30 max-h-64 overflow-y-auto">
                                    {isLoading && !insight ? (
                                        <div className="flex flex-col gap-2 items-center justify-center h-24">
                                            <div className="w-7 h-7 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
                                            <span className="text-[11px] text-indigo-200 animate-pulse">
                                                {currentState || "Connecting…"}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-line">
                                            {insight}
                                        </div>
                                    )}
                                    {isLoading && insight && (
                                        <span className="inline-block w-1.5 h-4 bg-indigo-300 ml-1 animate-pulse align-middle" />
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() =>
                                            fetchInsight(selectedMember)
                                        }
                                        disabled={isLoading}
                                        className="w-full py-2.5 border border-white/20 text-text-primary text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
                                    >
                                        🔄 Regenerate Insight
                                    </button>
                                    <button
                                        onClick={() =>
                                            alert(
                                                `Sending email to ${selectedMember.email}…`,
                                            )
                                        }
                                        disabled={isLoading || !insight}
                                        className="w-full py-2.5 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-40"
                                    >
                                        📧 Send Motivational Email
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-10 px-4 border-2 border-dashed border-indigo-400/50 rounded-2xl bg-white/5 text-center">
                                <span className="text-3xl">🏋️</span>
                                <p className="text-sm text-indigo-200 leading-relaxed">
                                    Click{" "}
                                    <strong className="text-white">
                                        AI Insight
                                    </strong>{" "}
                                    on any member to generate personalised
                                    coaching tips.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick legend */}
                    <div className="bg-surface rounded-2xl border border-slate-200 p-4 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                            Attendance Legend
                        </p>
                        {[
                            { color: "bg-emerald-500", label: "> 80% — Great" },
                            {
                                color: "bg-amber-500",
                                label: "50–80% — Moderate",
                            },
                            {
                                color: "bg-rose-500",
                                label: "< 50% — Needs attention",
                            },
                        ].map(({ color, label }) => (
                            <div
                                key={label}
                                className="flex items-center gap-2 text-xs text-slate-600"
                            >
                                <span
                                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`}
                                />
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberManagement;
