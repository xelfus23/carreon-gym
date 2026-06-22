import {
  CheckCircle2,
  Clock,
  ExternalLink,
  ShoppingBag,
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
import { CartItemsPopup } from "../Popups/CartItemPopup";

interface TransactionRowProps {
  tx: TransactionProps;
  setSelectedReceipt: Dispatch<SetStateAction<string | null | undefined>>;
  onAccept: (t: TransactionProps) => void;
  onDeny: (t: TransactionProps) => void;
  onDelete: (t: TransactionProps) => void;
}

const mapMethod: Record<string, { label: string; text: string }> = {
  gcash: { label: "Gcash", text: "text-blue-500" },
  cash: { label: "Cash", text: "text-green-500" },
  bank_transfer: { label: "Bank Transfer", text: "text-amber-500" },
};

function formatReferenceNo(
  referenceNo: string | null | undefined,
  transactionId: number,
): string {
  return referenceNo || `TRX-${transactionId}`;
}

export default function TransactionRow({
  tx,
  setSelectedReceipt,
  onAccept,
  onDeny,
}: TransactionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const cartTriggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const hasAction = !(
    tx.status === "paid" ||
    tx.status === "cancelled" ||
    tx.status === "rejected"
  );

  const actions: ActionItemProps[] = [
    {
      label: "Accept",
      icon: <CheckCircle2 size={16} />,
      onClick: () => {
        onAccept(tx);
        closeMenu();
      },
      variant: "success",
    },
    {
      label: "Deny",
      icon: <XCircle size={16} />,
      onClick: () => {
        onDeny(tx);
        closeMenu();
      },
      variant: "warning",
    },
  ];

  const itemsArray = tx.items || [];
  const itemsCount = itemsArray.length;
  const firstItem = itemsArray[0];
  const hasMultipleItems = itemsCount > 1;

  return (
    <tr className="transition-colors group hover:bg-border/40 border-b border-border/50">
      {/* REFERENCE NUMBER */}
      <td className="p-4 whitespace-nowrap">
        <p className="text-text-secondary text-[10px] font-mono">
          {formatReferenceNo(tx.reference_no, tx.transaction_id)}
        </p>
      </td>

      {/* DATE */}
      <td className="p-4 whitespace-nowrap">
        <span className="text-xs text-text-secondary">
          {formatDate(tx.paid_at || tx.created_at)}
        </span>
      </td>

      {/* CUSTOMER NAME */}
      <td className="p-4 whitespace-nowrap">
        <p className="font-bold text-sm">
          {tx.member_name || "Walk-in Customer"}
        </p>
      </td>

      {/* VISUAL PRODUCT LIST COLUMN WITH POPUP LINK WINDOW */}
      <td className="p-4 max-w-xs">
        <div className="flex items-center gap-3">
          {/* Avatar Image Frame */}
          <div className="relative w-10 h-10 rounded-lg bg-border/50 shrink-0 flex items-center justify-center border border-border">
            {firstItem?.icon_url ? (
              <img
                src={firstItem.icon_url}
                alt={firstItem.name}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <ShoppingBag size={16} className="text-text-secondary" />
            )}

            {hasMultipleItems && (
              <span className="absolute -top-1 -right-1 bg-primary text-background text-xs font-bold px-1 rounded-full min-w-4 text-center shadow-sm">
                {itemsCount}
              </span>
            )}
          </div>

          {/* Interactive Trigger block */}
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {firstItem?.name || "Unknown Item"}
            </p>

            {hasMultipleItems ? (
              <button
                ref={cartTriggerRef}
                onClick={() => setCartOpen((o) => !o)}
                className={`text-left text-[11px] font-semibold cursor-pointer hover:underline mt-0.5 transition-colors ${
                  cartOpen ? "text-text-primary" : "text-primary"
                }`}
              >
                view all {itemsCount} items
              </button>
            ) : (
              <span className="text-[11px] text-text-secondary">
                Qty: {firstItem?.quantity || tx.quantity || 1}
              </span>
            )}

            {/* Portal Popup mount invocation */}
            {cartOpen && (
              <CartItemsPopup
                items={itemsArray}
                anchorRef={cartTriggerRef}
                onClose={closeCart}
              />
            )}
          </div>
        </div>
      </td>

      {/* TOTAL AMOUNT */}
      <td className="p-4 text-sm font-semibold whitespace-nowrap">
        {formatCurrency(tx.amount)}
      </td>

      {/* TRANSACTION STATUS */}
      <td className="p-4 whitespace-nowrap">
        {tx.status === "paid" ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-500 text-[11px] font-black tracking-wider bg-emerald-500/10 px-2 py-1 rounded-md">
            <CheckCircle2 size={12} /> PAID
          </span>
        ) : tx.status === "cancelled" || tx.status === "rejected" ? (
          <span className="inline-flex items-center gap-1.5 text-red-500 text-[11px] font-black tracking-wider bg-red-500/10 px-2 py-1 rounded-md">
            <XCircle size={12} /> {tx.status.toUpperCase()}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-amber-500 text-[11px] font-black tracking-wider bg-amber-500/10 px-2 py-1 rounded-md">
            <Clock size={12} className="animate-pulse" /> PENDING
          </span>
        )}
      </td>

      {/* METHOD */}
      <td
        className={`p-4 text-xs font-bold whitespace-nowrap ${mapMethod[tx.method]?.text || "text-text-primary"}`}
      >
        {mapMethod[tx.method]?.label || tx.method}
      </td>

      {/* RECEIPT IMAGE */}
      <td className="p-4 whitespace-nowrap">
        {tx.receipt_image_url ? (
          <button
            onClick={() => setSelectedReceipt(tx.receipt_image_url)}
            className="flex items-center gap-1 text-primary text-xs font-bold hover:opacity-70 transition-opacity"
          >
            <ExternalLink size={12} /> View
          </button>
        ) : (
          <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
            None
          </span>
        )}
      </td>

      {/* ACTION MENU CONTROLS */}
      <td className="p-4">
        {hasAction && (
          <div className="flex items-center justify-end">
            <button
              ref={triggerRef}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Product actions"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all
                          opacity-0 group-hover:opacity-100 focus:opacity-100
                          ${menuOpen ? "opacity-100 bg-border text-text-primary" : "text-text-secondary hover:bg-border hover:text-text-primary"}`}
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
                onClose={closeMenu}
              />
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
