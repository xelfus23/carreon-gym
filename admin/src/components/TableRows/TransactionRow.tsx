import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash,
  XCircle,
} from "lucide-react";
import { type TransactionProps } from "../../hooks/useTransactions";
import { formatDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ActionItemProps } from "../../types";
import { ActionMenu } from "../ActionMenu";

interface TransactionRowProps {
  tx: TransactionProps;
  setSelectedReceipt: Dispatch<SetStateAction<string | null | undefined>>;
  onAccept: (t: TransactionProps) => void;
  onDeny: (t: TransactionProps) => void;
  onDelete: (t: TransactionProps) => void;
}

export default function TransactionRow({
  tx,
  setSelectedReceipt,
  onAccept,
  onDeny,
  onDelete,
}: TransactionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setMenuOpen(false), []);

  const actions: ActionItemProps[] =
    (tx.status === "paid" || tx.status === "cancelled")
      ? [
        {
          label: "Delete",
          icon: <Trash size={16} />,
          onClick: () => {
            onDelete(tx)
            close();
          },
          variant: "danger" as const,
          dividerBefore: true,
        },
      ]
      : [
        {
          label: "Accept",
          icon: <CheckCircle2 size={16} />,
          onClick: () => {
            onAccept(tx)
            close();
          },
          variant: "success",
        },
        {
          label: "Deny",
          icon: <XCircle size={16} />,
          onClick: () => {
            onDeny(tx)
            close();
          },
          variant: "warning",
        },
      ];

  return (
    <tr
      key={tx.transaction_id}
      className={`transition-colors group hover:bg-border/40`}
    >
      <td className="p-4 whitespace-nowrap">
        <p className="text-text-secondary text-[10px]">{tx.reference_no}</p>
      </td>

      <td className="p-4 whitespace-nowrap">
        <span className="text-xs">{formatDate(tx.paid_at)}</span>
      </td>

      <td className="p-4 whitespace-nowrap">
        <p className="font-bold text-sm">{tx.member_name}</p>
      </td>
      <td className="p-4 whitespace-nowrap">
        <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
          {tx.item_name}
        </p>
      </td>
      <td className="p-4 text-xs">{formatCurrency(tx.amount)}</td>
      <td className="p-4">
        {tx.status === "paid" ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-500 text-[11px] font-black">
            <CheckCircle2 size={14} /> PAID
          </span>
        ) : tx.status === "cancelled" ? (
          <span className="inline-flex items-center gap-1.5 text-red-500 text-[11px] font-black">
            <XCircle size={14} /> CANCELLED
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-amber-500 text-[11px] font-black">
            <Clock size={14} className="animate-pulse" /> PENDING
          </span>
        )}
      </td>
      <td className="p-4 whitespace-nowrap">
        {tx.receipt_image_url ? (
          <button
            onClick={() => setSelectedReceipt(tx.receipt_image_url!)}
            className="flex items-center gap-1 text-primary text-xs font-bold hover:opacity-70"
          >
            <ExternalLink size={12} /> View
          </button>
        ) : (
          <span className="text-[10px] text-text-secondary uppercase">
            No Image
          </span>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end">
          <button
            ref={triggerRef}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Product actions"
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
