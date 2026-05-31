import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ActionItemProps } from "../types";

export function ActionMenu({
  items,
  anchorRef,
  onClose,
}: {
  items: ActionItemProps[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 200;
      const menuWidth = menuRef.current?.offsetWidth ?? 208;

      // Smart positioning: flip upward if there's no space below
      const spaceBelow = window.innerHeight - rect.bottom;
      const top =
        spaceBelow > menuHeight ? rect.bottom + 6 : rect.top - menuHeight - 6;
      const left = rect.right - menuWidth;

      setPos({ top, left });
    };

    place();
    const raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [anchorRef]);

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

    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onClose, true);
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
      className="w-52 bg-surface border border-border shadow-2xl shadow-black/40 overflow-hidden"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        animation: "menuIn 130ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @keyframes menuIn {
          from { opacity: 0; transform: scale(0.98) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      {items.map((item, i) => (
        <div key={i}>
          {item.dividerBefore && (
            <div className="border-t border-border" />
          )}
          <button
            disabled={item.disabled}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-3 text-xs transition-colors font-bold text-left tracking-tight
              disabled:opacity-40 disabled:cursor-not-allowed ${variantCls[item.variant ?? "default"]}`}
          >
            <span className="flex w-4">
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
