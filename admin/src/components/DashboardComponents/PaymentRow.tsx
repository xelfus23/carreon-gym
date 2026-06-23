import { avatarColor, PAYMENT_STATUS_STYLES } from "../../constants";
import { formatCurrency } from "../../utils/formatCurrency";


interface RecentPayment {
  member_name: string;
  amount: number;
  method: string;
  transaction_type: string;
  item_name: string;
  status: "paid" | "pending" | "refunded" | "cancelled" | "rejected";
  paid_at: string | null;
  initials: string;
}



const PaymentRow: React.FC<{ payment: RecentPayment; index: number }> = ({
  payment,
  index,
}) => (
  <div
    className={`flex items-center gap-3 py-3 ${index !== 0 ? "border-t border-border" : ""
      }`}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(payment.initials)}`}
    >
      {payment.initials}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-text-primary truncate">
        {payment.member_name}
      </p>
      <p className="text-xs text-text-secondary truncate">
        {payment.item_name}
      </p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-sm font-bold text-text-primary">
        {formatCurrency(payment.amount)}
      </p>
      <span
        className={`text-xs font-semibold px-1.5 py-0.5 rounded capitalize ${PAYMENT_STATUS_STYLES[payment.status] ?? "text-text-secondary"
          }`}
      >
        {payment.status}
      </span>
    </div>
  </div>
);

export default PaymentRow