import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingBag } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";

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

export function CartItemsPopup({
  items,
  anchorRef,
  onClose,
}: CartItemsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const popupHeight = popupRef.current?.offsetHeight ?? 280;
      const popupWidth = popupRef.current?.offsetWidth ?? 288; // w-72

      // Check vertical space (flip up if squeezed at the bottom of screen)
      const spaceBelow = window.innerHeight - rect.bottom;
      const top =
        spaceBelow > popupHeight ? rect.bottom + 6 : rect.top - popupHeight - 6;

      // Horizontal align left side of the popup with the left edge of trigger text link
      let left = rect.left;
      if (left + popupWidth > window.innerWidth) {
        left = window.innerWidth - popupWidth - 16; // Margin safeguard
      }

      setPos({ top, left });
    };

    place();
    const raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [anchorRef]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popupRef.current?.contains(e.target as Node) ||
        anchorRef.current?.contains(e.target as Node)
      )
        return;
      onClose();
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("scroll", onClose, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose, anchorRef]);

  if (!pos) return null;

  return createPortal(
    <div
      ref={popupRef}
      className="w-72 bg-surface border border-border shadow-2xl shadow-black/50 rounded-xl overflow-hidden flex flex-col"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 9998, // Stays right around contextual menus
        animation: "popupIn 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* POPUP HEADER */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-border/20 border-b border-border">
        <span className="text-[11px] font-bold text-text-secondary tracking-wider uppercase">
          Items Breakdown ({items.length})
        </span>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors p-1 hover:bg-border rounded-md"
        >
          <X size={14} />
        </button>
      </div>

      {/* ITEMS LIST (SCROLLABLE CONTAINER) */}
      <div className="max-h-60 overflow-y-auto divide-y divide-border/40 custom-scrollbar">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 hover:bg-border/20 transition-colors"
          >
            {/* Thumbnail Preview */}
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

            {/* Product Meta */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">
                {item.name}
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                {formatCurrency(item.price_at_purchase)} × {item.quantity}
              </p>
            </div>

            {/* Calculated Subtotal line */}
            <div className="text-xs font-bold text-text-primary whitespace-nowrap">
              {formatCurrency(item.price_at_purchase * item.quantity)}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
