import {
    useState,
    useRef,
    useEffect,
    useCallback,
    type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import type { AdminMemberListItem, SubscriptionStatus } from "../../types";
import {
    Ban,
    ClockPlus,
    Mail,
    // Sparkles,
    Trash,
    UserKey,
    UserLock,
} from "lucide-react";

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
    active: "bg-primary-dark text-text-primary",
    expired: "bg-danger text-text-primary",
    pending: "bg-yellow-100 text-text-primary",
    cancelled: "bg-rose-100 text-rose-600",
};

interface ActionItem {
    label: string;
    icon: ReactElement;
    onClick: () => void;
    variant?: "default" | "warning" | "danger";
    dividerBefore?: boolean;
    disabled?: boolean;
}

// ── Portal menu — rendered on document.body, positioned via getBoundingClientRect ──
function ActionMenu({
    items,
    anchorRef,
    onClose,
}: {
    items: ActionItem[];
    anchorRef: React.RefObject<HTMLButtonElement | null>;
    onClose: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

    // Calculate position from anchor button
    useEffect(() => {
        const anchor = anchorRef.current;
        if (!anchor) return;

        const place = () => {
            const rect = anchor.getBoundingClientRect();
            const menuHeight = menuRef.current?.offsetHeight ?? 200;
            const menuWidth = menuRef.current?.offsetWidth ?? 208;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceRight = window.innerWidth - rect.right;

            const top =
                spaceBelow > menuHeight
                    ? rect.bottom + 6 // open downward
                    : rect.top - menuHeight - 6; // flip upward

            const left =
                spaceRight > menuWidth
                    ? rect.right - menuWidth // align to right edge of button
                    : rect.left - menuWidth + rect.width; // fallback left-align

            setPos({ top, left });
        };

        // Run twice: first pass sets rough position, second pass corrects after render
        place();
        const raf = requestAnimationFrame(place);
        return () => cancelAnimationFrame(raf);
    }, [anchorRef]);

    // Close on outside click
    useEffect(() => {
        const onMouse = (e: MouseEvent) => {
            if (
                menuRef.current?.contains(e.target as Node) ||
                anchorRef.current?.contains(e.target as Node)
            )
                return;
            onClose();
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        const onScroll = () => onClose(); // close on any scroll

        document.addEventListener("mousedown", onMouse);
        document.addEventListener("keydown", onKey);
        window.addEventListener("scroll", onScroll, true);
        return () => {
            document.removeEventListener("mousedown", onMouse);
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("scroll", onScroll, true);
        };
    }, [onClose, anchorRef]);

    const variantCls: Record<string, string> = {
        default: "text-text-primary hover:bg-border/60",
        warning: "text-amber-500 hover:bg-amber-500/10",
        danger: "text-rose-500 hover:bg-rose-500/10",
    };

    if (!pos) return null;

    return createPortal(
        <div
            ref={menuRef}
            className="w-52 bg-surface border border-border rounded-2xl shadow-2xl shadow-black/30 overflow-hidden"
            style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                zIndex: 9999,
                animation: "menuIn 130ms cubic-bezier(0.16,1,0.3,1)",
            }}
        >
            <style>{`
                @keyframes menuIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-4px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0); }
                }
            `}</style>

            {items.map((item, i) => (
                <div key={i}>
                    {item.dividerBefore && (
                        <div className="my-1 border-t border-border" />
                    )}
                    <button
                        disabled={item.disabled}
                        onClick={() => {
                            item.onClick();
                            onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${variantCls[item.variant ?? "default"]}`}
                    >
                        <span className="aspect-square items-center h-full flex">
                            {item.icon}
                        </span>
                        {item.label}
                    </button>
                </div>
            ))}
        </div>,
        document.body,
    );
}

// ── MemberRow ─────────────────────────────────────────────────────────────────
export default function MemberRow({
    m,
    // isLoading,
    isSelected,
    // fetchInsight,
    onSetPlan,
    onSuspend,
    onBan,
    onDelete,
    onSendEmail,
}: {
    m: AdminMemberListItem;
    isLoading: boolean;
    isSelected: boolean;
    fetchInsight: (m: AdminMemberListItem) => void;
    onSetPlan: (m: AdminMemberListItem) => void;
    onSuspend: (m: AdminMemberListItem) => void;
    onBan: (m: AdminMemberListItem) => void;
    onDelete: (m: AdminMemberListItem) => void;
    onSendEmail: (m: AdminMemberListItem) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const close = useCallback(() => setMenuOpen(false), []);

    const attendanceColor =
        m.attendance_rate > 80
            ? "bg-emerald-500"
            : m.attendance_rate > 50
              ? "bg-amber-500"
              : "bg-rose-500";

    const isSuspended = m.account_status === "suspended";
    const isDeleted = m.account_status === "deleted";

    const actions: ActionItem[] = [
        // {
        //     label: "AI Insight",
        //     icon: <Sparkles className="h-4" />,
        //     onClick: () => fetchInsight(m),
        //     disabled: isLoading,
        // },
        {
            label: "Set Plan",
            icon: <ClockPlus className="h-4" />,
            onClick: () => onSetPlan(m),
        },
        {
            label: "Send Email",
            icon: <Mail className="h-4" />,
            onClick: () => onSendEmail(m),
        },
        {
            label: isSuspended ? "Unsuspend Member" : "Suspend Member",
            icon: isSuspended ? (
                <UserLock className="h-4" />
            ) : (
                <UserKey className="h-4" />
            ),
            onClick: () => onSuspend(m),
            variant: isSuspended ? "default" : "warning",
            dividerBefore: true,
        },
        {
            label: "Ban / Blacklist",
            icon: <Ban className="h-4" />,
            onClick: () => onBan(m),
            variant: "danger",
        },
        ...(!isDeleted
            ? [
                  {
                      label: "Delete Member",
                      icon: <Trash className="h-4" />,
                      onClick: () => onDelete(m),
                      variant: "danger" as const,
                      dividerBefore: true,
                  },
              ]
            : []),
    ];

    return (
        <tr
            className={`transition-colors group ${
                isSelected
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "hover:bg-border/40"
            }`}
        >
            <td className="px-5 py-3.5">
                <div className="font-semibold text-text-primary leading-tight">
                    {m.id.toString()}
                </div>
            </td>

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
                    <div className="text-[11px] text-text-secondary mt-0.5">
                        {m.weight_kg} kg
                        {m.weight_recorded_at && (
                            <> · {formatRelativeDate(m.weight_recorded_at)}</>
                        )}
                    </div>
                )}
            </td>

            {/* Subscription */}
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
                    <span className="text-text-secondary text-xs">—</span>
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

            {/* Visits */}
            <td className="px-5 py-3.5 text-center">
                <span className="text-base font-black text-text-primary">
                    {m.total_visits_this_month ?? 0}
                </span>
                {m.total_visits_all_time != null && (
                    <div className="text-[11px] text-text-secondary">
                        {m.total_visits_all_time} total
                    </div>
                )}
            </td>

            {/* Attendance */}
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-border h-1.5 rounded-full overflow-hidden min-w-[60px]">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${attendanceColor}`}
                            style={{
                                width: `${Math.min(100, m.attendance_rate)}%`,
                            }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-text-primary w-8 text-right tabular-nums">
                        {m.attendance_rate}%
                    </span>
                </div>
            </td>

            {/* ── Actions ── */}
            <td className="px-5 py-3.5">
                <div className="flex items-center justify-end">
                    <button
                        ref={triggerRef}
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label="Member actions"
                        aria-haspopup="true"
                        aria-expanded={menuOpen}
                        className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all
                            opacity-0 group-hover:opacity-100 focus:opacity-100
                            ${
                                menuOpen
                                    ? "opacity-100 bg-border text-text-primary"
                                    : "text-text-secondary hover:bg-border hover:text-text-primary"
                            }`}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                        >
                            <circle cx="8" cy="3" r="1.4" />
                            <circle cx="8" cy="8" r="1.4" />
                            <circle cx="8" cy="13" r="1.4" />
                        </svg>
                    </button>

                    {menuOpen && (
                        <ActionMenu
                            items={actions}
                            anchorRef={triggerRef}
                            onClose={close}
                        />
                    )}
                </div>
            </td>
        </tr>
    );
}
