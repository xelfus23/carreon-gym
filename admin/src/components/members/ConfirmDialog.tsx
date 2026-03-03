interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel: string;
    variant: "warning" | "danger";
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    title,
    message,
    confirmLabel,
    variant,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const btnCls =
        variant === "danger"
            ? "bg-rose-600 hover:bg-rose-700 text-white"
            : "bg-amber-500 hover:bg-amber-600 text-white";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={onCancel}
        >
            <div
                className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-bold text-text-primary mb-2">
                    {title}
                </h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                    {message}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 text-sm font-semibold border border-border rounded-xl text-text-secondary hover:bg-border/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${btnCls}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
