import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface PopupListProps {
  title: string;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}

export function PopupList({ title, anchorRef, onClose, children }: PopupListProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const popupHeight = popupRef.current?.offsetHeight ?? 280;
      const popupWidth = popupRef.current?.offsetWidth ?? 288;

      const spaceBelow = window.innerHeight - rect.bottom;
      const top =
        spaceBelow > popupHeight ? rect.bottom + 6 : rect.top - popupHeight - 6;

      let left = rect.left;
      if (left + popupWidth > window.innerWidth) {
        left = window.innerWidth - popupWidth - 16;
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
        zIndex: 9998,
        animation: "popupIn 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-border/20 border-b border-border">
        <span className="text-[11px] font-bold text-text-secondary tracking-wider uppercase">
          {title}
        </span>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors p-1 hover:bg-border rounded-md"
        >
          <X size={14} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="max-h-60 overflow-y-auto divide-y divide-border/40 custom-scrollbar">
        {children}
      </div>
    </div>,
    document.body,
  );
}