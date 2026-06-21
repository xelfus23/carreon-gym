import { useRef, useState, useCallback } from "react";
import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";
import { PopupList } from "./PopupList";

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  price_at_purchase: number;
  icon_url: string | null;
}

interface CartItemsPopupProps {
  items: CartItem[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function CartItemsPopup({ items, anchorRef, onClose }: CartItemsPopupProps) {
  return (
    <PopupList
      title={`Items Breakdown (${items.length})`}
      anchorRef={anchorRef}
      onClose={onClose}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 hover:bg-border/20 transition-colors"
        >
          {/* Thumbnail */}
          <div className="w-9 h-9 rounded-md bg-border/40 border border-border shrink-0 flex items-center justify-center overflow-hidden">
            {item.icon_url ? (
              <img
                src={item.icon_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ShoppingBag size={14} className="text-text-secondary" />
            )}
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">{item.name}</p>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {formatCurrency(item.price_at_purchase)} × {item.quantity}
            </p>
          </div>

          {/* Subtotal */}
          <div className="text-xs font-bold text-text-primary whitespace-nowrap">
            {formatCurrency(item.price_at_purchase * item.quantity)}
          </div>
        </div>
      ))}
    </PopupList>
  );
}

// ── Convenience wrapper with its own open/close state ─────────────────────────
export function CartItemsPopupTrigger({ items }: { items: CartItem[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  if (items.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className={`text-left text-[11px] font-semibold cursor-pointer hover:underline mt-0.5 transition-colors ${open ? "text-text-primary" : "text-primary"
          }`}
      >
        view all {items.length} items
      </button>
      {open && (
        <CartItemsPopup items={items} anchorRef={triggerRef} onClose={close} />
      )}
    </>
  );
}