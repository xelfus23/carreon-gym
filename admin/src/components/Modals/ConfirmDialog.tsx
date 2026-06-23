import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X, CheckCircle2 } from "lucide-react";
import type { ConfirmDialogModalProps } from "../../types";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  // Render Logic: Map colors and configurations based on the variant token
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          iconBg: "bg-emerald-500/10 text-emerald-500",
          confirmBtnBg: "bg-primary hover:bg-primary-dark text-background",
          icon: <CheckCircle2 size={22} />,
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/10 text-amber-500",
          confirmBtnBg:
            "bg-amber-500 hover:bg-amber-800 focus:ring-amber-500/20 text-white",
          icon: <AlertTriangle size={22} />,
        };
      case "danger":
      default:
        return {
          iconBg: "bg-red-500/10 text-red-500",
          confirmBtnBg:
            "bg-red-500 hover:bg-red-800 focus:ring-red-500/20 text-white",
          icon: <Trash2 size={22} />,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click interceptor */}
      <div
        className="absolute inset-0"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Card wrapper */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-surface rounded-xl border border-border shadow-2xl p-4 flex flex-col space-y-4 animate-in zoom-in-95 duration-200 content-start"
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 hover:bg-border rounded-full transition-colors text-text-secondary disabled:opacity-50"
        >
          <X size={18} />
        </button>

        {/* Content Section */}
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full shrink-0 ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <div className="space-y-1 flex-1 pr-6">
            <h3 className="text-md font-bold text-text-primary leading-tight">
              {title}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="flex gap-3 pt-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="uppercase font-bold text-sm px-6 py-1 rounded-md font-mulish bg-danger border-danger border-2 hover:bg-danger/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`uppercase font-bold text-sm px-6 rounded-md font-mulish transition-all hover:scale-105 active:scale-95 cursor-pointer ${styles.confirmBtnBg}`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
