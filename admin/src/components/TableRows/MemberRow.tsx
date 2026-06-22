import { useState, useRef, useCallback } from "react";
import type { ActionItemProps, UserAccountProps, SubscriptionItem, SubscriptionStatus } from "../../types";
import {
  Ban, Check, ClockPlus, Ellipsis,
  Trash, UserKey, UserLock
} from "lucide-react";
import { ActionMenu } from "../ActionMenu";
import { PopupList } from "../Popups/PopupList";

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
  active: "bg-emerald-500 text-background",
  suspended: "bg-amber-500 text-amber-50",
  banned: "bg-rose-500 text-rose-50",
  deleted: "bg-zinc-700 text-zinc-50",
};

const SUB_BADGE: Record<SubscriptionStatus, string> = {
  active: "bg-primary-dark text-background",
  expired: "bg-danger text-text-primary",
  pending: "bg-yellow-100 text-text-primary",
  cancelled: "bg-rose-100 text-rose-600",
};

// ── Subscription status dot colors ───────────────────────────────────────────
const SUB_DOT: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-500",
  expired: "bg-red-400",
  pending: "bg-yellow-400",
  cancelled: "bg-rose-400",
};

function SubscriptionCell({ subscriptions }: { subscriptions: SubscriptionItem[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  if (subscriptions.length === 0) {
    return <span className="text-text-secondary text-xs">—</span>;
  }

  const first = subscriptions[0];
  const hasMore = subscriptions.length > 1;

  console.log(subscriptions)

  const activeSubs = subscriptions.filter(v => v.status === "active")

  return (
    <div className="flex flex-col gap-0.5">
      {/* First subscription preview */}
      <div className="flex items-center gap-1.5">
        <span
          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wide ${SUB_BADGE[first.status]}`}
        >
          {first.status}
        </span>
        <span className="text-xs font-medium text-text-primary truncate max-w-[100px]">
          {first.plan_name}
        </span>
      </div>

      {first.expiry_date && (
        <div className="text-[11px] text-text-secondary ml-0.5">
          Expires{" "}
          {new Date(first.expiry_date).toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      )}

      {/* "view all" trigger when there are multiple */}
      {hasMore && (
        <>
          <button
            ref={triggerRef}
            onClick={() => setOpen((o) => !o)}
            className={`text-left text-[11px] font-semibold hover:underline mt-0.5 transition-colors ${open ? "text-text-primary" : "text-primary"
              }`}
          >
            +{activeSubs.length - 1} more active subscription{activeSubs.length - 1 > 1 ? "s" : ""}
          </button>

          {open && (
            <PopupList
              title={`${activeSubs.length}`}
              anchorRef={triggerRef}
              onClose={close}
            >
              {activeSubs.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-start gap-3 p-3 hover:bg-border/20 transition-colors"
                >
                  {/* Status dot */}
                  <span
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${SUB_DOT[sub.status]}`}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {sub.plan_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wide ${SUB_BADGE[sub.status]}`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    {sub.expiry_date && (
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Expires{" "}
                        {new Date(sub.expiry_date).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                    {sub.start_date && (
                      <p className="text-[11px] text-text-secondary">
                        Started{" "}
                        {new Date(sub.start_date).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </PopupList>
          )}
        </>
      )}
    </div>
  );
}

// ── MemberRow ─────────────────────────────────────────────────────────────────
export default function MemberRow({
  m,
  onSetPlan,
  onSuspend,
  onBan,
  onDelete,
  onVerify,
  onSelect
}: {
  m: UserAccountProps;
  onSetPlan: (m: UserAccountProps) => void;
  onSuspend: (m: UserAccountProps) => void;
  onBan: (m: UserAccountProps) => void;
  onDelete: (m: UserAccountProps) => void;
  onVerify: (m: UserAccountProps) => void;
  onSelect: (m: UserAccountProps) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setMenuOpen(false), []);

  const isSuspended = m.account_status === "suspended";
  const isDeleted = m.account_status === "deleted";
  const isBanned = m.account_status === "banned";

  // Derive a single top-level subscription status for the plan column
  // const activeSub = m.subscriptions.find((s) => s.status === "active");

  const actions: ActionItemProps[] = [

    {
      label: "Set Plan",
      icon: <ClockPlus className="h-4" />,
      onClick: () => { onSetPlan(m); close(); },
    },
    {
      label: m.verified ? "Unverify Member" : "Verify Member",
      icon: <Check className="h-4" />,
      onClick: () => { onVerify(m); close(); },
    },
    {
      label: "More Details",
      icon: <Ellipsis className="h-4" />,
      onClick: () => { onSelect(m); close() }
    },
    {
      label: isSuspended ? "Unsuspend Member" : "Suspend Member",
      icon: isSuspended ? <UserLock className="h-4" /> : <UserKey className="h-4" />,
      onClick: () => { onSuspend(m); close(); },
      variant: isSuspended ? "default" : "warning",
      dividerBefore: true,
      disabled: isBanned || isDeleted,
    },
    {
      label: "Ban / Blacklist",
      icon: <Ban className="h-4" />,
      onClick: () => { onBan(m); close(); },
      variant: "danger",
      disabled: isBanned,
    },
    ...(!isDeleted
      ? [{
        label: "Delete Member",
        icon: <Trash className="h-4" />,
        onClick: () => { onDelete(m); close(); },
        variant: "danger" as const,
        dividerBefore: true,
      }]
      : []),
  ];

  return (
    <tr className="transition-colors group hover:bg-border/40">
      <td className="p-4 text-xs text-text-secondary">{m.id.toString()}</td>

      {/* Member */}
      <td className="p-4">
        <div className="font-semibold text-text-primary leading-tight">
          {m.first_name} {m.last_name}
        </div>
        <div className="text-[11px] text-text-secondary mt-0.5">{m.email}</div>
        {m.phone_number && (
          <div className="text-[11px] text-text-secondary">{m.phone_number}</div>
        )}
      </td>

      {/* Account status */}
      <td className="p-4">
        <span
          className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wide ${ACCOUNT_BADGE[m.account_status] ?? "bg-surface text-text-secondary"
            }`}
        >
          {m.account_status}
        </span>
        {m.verified ? (
          <span className="ml-1.5 text-[10px] text-primary font-semibold">Verified</span>
        ) : (
          <span className="ml-1.5 text-[10px] text-yellow-400">Unverified</span>
        )}
      </td>

      {/* Plan — shows active plan name or falls back to latest */}
      {/* <td className="p-4 text-sm">
        <span className="font-medium text-text-primary">
          {activeSub?.plan_name ?? m.subscriptions[0]?.plan_name ?? "—"}
        </span>
        {m.weight_kg != null && (
          <div className="text-[11px] text-text-secondary mt-0.5">
            {m.weight_kg} kg
            {m.weight_recorded_at && <> · {formatRelativeDate(m.weight_recorded_at)}</>}
          </div>
        )}
      </td> */}

      {/* Subscription — popup for multiple, inline for single */}
      <td className="p-4">
        <SubscriptionCell subscriptions={m.subscriptions} />
      </td>

      {/* Last check-in */}
      <td className="p-4 text-sm text-text-primary">
        {formatRelativeDate(m.last_check_in)}
        {m.last_login && (
          <div className="text-[11px] text-text-secondary mt-0.5">
            Login: {formatRelativeDate(m.last_login)}
          </div>
        )}
      </td>

      {/* Visits */}
      <td className="p-4">
        <span className="text-base font-black text-text-primary">
          {m.total_visits_this_month ?? 0}
        </span>
        {m.total_visits_all_time != null && (
          <div className="text-[11px] text-text-secondary">
            {m.total_visits_all_time} total
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="p-4">
        <div className="flex items-center justify-end">
          <button
            ref={triggerRef}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Member actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all
              opacity-0 group-hover:opacity-100 focus:opacity-100
              ${menuOpen
                ? "opacity-100 bg-border text-text-primary"
                : "text-text-secondary hover:bg-border hover:text-text-primary"
              }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.4" />
              <circle cx="8" cy="8" r="1.4" />
              <circle cx="8" cy="13" r="1.4" />
            </svg>
          </button>

          {menuOpen && (
            <ActionMenu items={actions} anchorRef={triggerRef} onClose={close} />
          )}
        </div>
      </td>
    </tr>
  );
}