import {
  useState,
  useRef,
  useCallback,
} from "react";
import type { ActionItemProps, AdminMemberListItem } from "../../types";
import {
  Ban,
  Check,
  Mail,
  Trash,
  UserKey,
  UserLock,
} from "lucide-react";
import { ActionMenu } from "../ActionMenu";

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


// ── AdminRow ─────────────────────────────────────────────────────────────────
export default function AdminRow({
  m,
  onSuspend,
  onBan,
  onDelete,
  onSendEmail,
  onVerify,
}: {
  m: AdminMemberListItem;
  onSuspend: (m: AdminMemberListItem) => void;
  onBan: (m: AdminMemberListItem) => void;
  onDelete: (m: AdminMemberListItem) => void;
  onSendEmail: (m: AdminMemberListItem) => void;
  onVerify: (m: AdminMemberListItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setMenuOpen(false), []);

  const isSuspended = m.account_status === "suspended";
  const isDeleted = m.account_status === "deleted";

  const actions: ActionItemProps[] = [
    {
      label: "Send Email",
      icon: <Mail className="h-4" />,
      onClick: () => onSendEmail(m),
    },
    {
      label: m.verified ? "Unverify Admin" : "Verify Admin",
      icon: <Check className="h-4" />,
      onClick: () => onVerify(m),
    },
    {
      label: isSuspended ? "Unsuspend Admin" : "Suspend Admin",
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
          label: "Delete Admin",
          icon: <Trash className="h-4" />,
          onClick: () => onDelete(m),
          variant: "danger" as const,
          dividerBefore: true,
        },
      ]
      : []),
  ];

  return (
    <tr className={`transition-colors group hover:bg-border/40`}>
      <td className="p-4 text-xs text-text-secondary">
        {m.id.toString()}
      </td>
      {/* Admin */}
      <td className="p-4">
        <div
          className={`font-semibold text-text-primary leading-tight`}
        >
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
      <td className="p-4">
        <span
          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ACCOUNT_BADGE[m.account_status] ??
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
      <td className="p-4 text-sm text-text-primary">
        {formatRelativeDate(m.last_check_in)}
        {m.last_login && (
          <div className="text-[11px] text-text-secondary mt-0.5">
            Login: {formatRelativeDate(m.last_login)}
          </div>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end">
          <button
            ref={triggerRef}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Admin actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all
                          opacity-0 group-hover:opacity-100 focus:opacity-100
                          ${menuOpen
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
