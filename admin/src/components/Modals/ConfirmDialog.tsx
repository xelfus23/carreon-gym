import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X, CheckCircle2 } from "lucide-react";
import type { ConfirmDialogProps } from "../../types";

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
}: ConfirmDialogProps) {
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
          iconBg: "bg-success/10 text-success",
          confirmBtnBg:
            "bg-success hover:bg-success-dark focus:ring-success/20 text-white",
          icon: <CheckCircle2 size={22} />,
        };
      case "warning":
        return {
          iconBg: "bg-warning/10 text-warning",
          confirmBtnBg:
            "bg-warning hover:bg-warning-dark focus:ring-warning/20 text-white",
          icon: <AlertTriangle size={22} />,
        };
      case "danger":
      default:
        return {
          iconBg: "bg-danger/10 text-danger",
          confirmBtnBg:
            "bg-danger hover:bg-danger-dark focus:ring-danger/20 text-white",
          icon: <Trash2 size={22} />,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click interceptor */}
      <div
        className="absolute inset-0"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Card wrapper */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-surface border border-border shadow-2xl p-6 flex flex-col space-y-4 animate-in zoom-in-95 duration-200 content-start"
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
            <h3 className="text-lg font-bold text-text-primary leading-tight">
              {title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
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
            className="px-4 py-2.5 border border-border font-bold text-sm text-text-secondary hover:bg-border transition-colors min-w-20"
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
            className={`px-5 py-2.5 font-bold text-sm rounded shadow-sm focus:ring-4 outline-none transition-all flex items-center justify-center min-w-25 disabled:opacity-70 ${styles.confirmBtnBg}`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
