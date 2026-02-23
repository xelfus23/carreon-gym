import type { AdminMemberListItem, SubscriptionStatus } from "../../types";

function formatRelativeDate(iso: string | null): string {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

const ACCOUNT_BADGE: Record<string, string> = {
    active: "bg-emerald-500 text-emerald-50",
    suspended: "bg-amber-500 text-amber-50",
    deleted: "bg-rose-500 text-rose-50",
};

const SUB_BADGE: Record<SubscriptionStatus, string> = {
    active: "bg-indigo-100 text-indigo-700",
    expired: "bg-slate-100 text-slate-500",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-rose-100 text-rose-600",
};

export default function MemberRow({
    m,
    isLoading,
    isSelected,
    fetchInsight,
    onSetPlan,
}: {
    m: AdminMemberListItem;
    isLoading: boolean;
    isSelected: boolean;
    fetchInsight: (m: AdminMemberListItem) => void;
    onSetPlan: (m: AdminMemberListItem) => void;
}) {
    const attendanceColor =
        m.attendance_rate > 80
            ? "bg-emerald-500"
            : m.attendance_rate > 50
              ? "bg-amber-500"
              : "bg-rose-500";

    return (
        <tr
            className={`transition-colors group ${
                isSelected
                    ? "bg-surface border-l-2 border-primary"
                    : "hover:bg-primary/10"
            }`}
        >
            {/* Member */}
            <td className="px-5 py-3.5">
                <div className="font-semibold text-text-primary leading-tight">
                    {m.first_name} {m.last_name}
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                    {m.email}
                </div>
                {m.phone_number && (
                    <div className="text-[11px] text-text-secondary">
                        {m.phone_number}
                    </div>
                )}
            </td>

            {/* Account status */}
            <td className="px-5 py-3.5">
                <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        ACCOUNT_BADGE[m.account_status] ??
                        "bg-surface text-slate-500"
                    }`}
                >
                    {m.account_status}
                </span>
                {m.verified ? (
                    <span className="ml-1.5 text-[10px] text-primary font-semibold">
                        ✓ Verified
                    </span>
                ) : (
                    <span className="ml-1.5 text-[10px] text-text-secondary">
                        Unverified
                    </span>
                )}
            </td>

            {/* Plan */}
            <td className="px-5 py-3.5 text-sm">
                <span className="font-medium text-text-primary">
                    {m.plan_name ?? "—"}
                </span>
                {m.weight_kg != null && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                        {m.weight_kg} kg
                        {m.weight_recorded_at && (
                            <> · {formatRelativeDate(m.weight_recorded_at)}</>
                        )}
                    </div>
                )}
            </td>

            {/* Subscription status */}
            <td className="px-5 py-3.5">
                {m.subscription_status ? (
                    <div>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                SUB_BADGE[m.subscription_status]
                            }`}
                        >
                            {m.subscription_status}
                        </span>
                        {m.expiry_date && (
                            <div className="text-[11px] text-text-secondary mt-0.5">
                                Expires{" "}
                                {new Date(m.expiry_date).toLocaleString([], {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-slate-300 text-xs">—</span>
                )}
            </td>

            {/* Last check-in */}
            <td className="px-5 py-3.5 text-sm text-text-primary">
                {formatRelativeDate(m.last_check_in)}
                {m.last_login && (
                    <div className="text-[11px] text-text-secondary mt-0.5">
                        Login: {formatRelativeDate(m.last_login)}
                    </div>
                )}
            </td>

            {/* Visits this month */}
            <td className="px-5 py-3.5 text-center">
                <span className="text-base font-black text-slate-700">
                    {m.total_visits_this_month ?? 0}
                </span>
                {m.total_visits_all_time != null && (
                    <div className="text-[11px] text-slate-400">
                        {m.total_visits_all_time} total
                    </div>
                )}
            </td>

            {/* Attendance bar */}
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden min-w-[60px]">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${attendanceColor}`}
                            style={{
                                width: `${Math.min(100, m.attendance_rate)}%`,
                            }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-8 text-right tabular-nums">
                        {m.attendance_rate}%
                    </span>
                </div>
            </td>

            {/* Actions */}
            <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => onSetPlan(m)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        Set plan
                    </button>
                    <button
                        onClick={() => fetchInsight(m)}
                        disabled={isLoading}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                            isSelected
                                ? "bg-indigo-600 text-white opacity-100"
                                : "text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100"
                        } disabled:opacity-30`}
                    >
                        {isSelected && isLoading ? "…" : "✨ AI Insight"}
                    </button>
                </div>
            </td>
        </tr>
    );
}
