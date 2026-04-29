import {
  Ban,
  CheckCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { type TransactionProps } from "../../hooks/useTransactions";
import { formatDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import type { Dispatch, SetStateAction } from "react";

interface TransactionRowProps {
  tx: TransactionProps;
  setSelectedReceipt: Dispatch<SetStateAction<string | null | undefined>>;
  setOpenMenuId: Dispatch<SetStateAction<number | null>>;
  openMenuId: number | null;
  OnVerify: () => void;
  OnDeny: () => void;
  OnDelete: () => void;
}

export default function TransactionRow({
  tx,
  setSelectedReceipt,
  setOpenMenuId,
  openMenuId,
  OnVerify,
  OnDeny,
  OnDelete,
}: TransactionRowProps) {
  return (
    <tr
      key={tx.transaction_id}
      className="hover:bg-border/10 transition-colors group"
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
      <td className="p-4 text-xs">
        {formatCurrency(tx.amount)}
      </td>
      <td className="p-4">
        {tx.status === "paid" ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-500 text-[11px] font-black">
            <CheckCircle size={14} /> PAID
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
      <td className="p-4 text-right">
        <div className="relative inline-flex">
          <button
            onClick={() =>
              setOpenMenuId((prev) =>
                prev === tx.transaction_id ? null : tx.transaction_id!,
              )
            }
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-border/50 transition-colors"
            aria-label="Transaction actions"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.4" />
              <circle cx="8" cy="8" r="1.4" />
              <circle cx="8" cy="13" r="1.4" />
            </svg>
          </button>

          {openMenuId === tx.transaction_id && (
            <div className="absolute right-0 top-10 z-20 w-48 bg-surface border border-border shadow-xl overflow-hidden">
              {tx.status === "pending" && (
                <>
                  <button
                    onClick={OnVerify}
                    className="w-full px-3 py-2 text-xs font-semibold text-left flex items-center gap-2 hover:bg-border/40 text-emerald-500"
                  >
                    <CheckCircle2 size={14} /> Verify payment
                  </button>
                  <button
                    onClick={OnDeny}
                    className="w-full px-3 py-2 text-xs font-semibold text-left flex items-center gap-2 hover:bg-border/40 text-amber-500"
                  >
                    <Ban size={14} /> Deny payment
                  </button>
                </>
              )}
              <button
                onClick={OnDelete}
                className="w-full px-3 py-2 text-xs font-semibold text-left flex items-center gap-2 hover:bg-rose-500/10 text-rose-500 border-t border-border"
              >
                <Trash2 size={14} /> Delete transaction
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
