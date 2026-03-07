import React, { useState } from "react";
import { type EquipmentPayload, type EquipmentTypes } from "../../hooks/useEquipments";
import {
    EMPTY_FORM,
    type FormState,
} from "./equipmentConstants";
import { EquipmentForm } from "./EquipmentForm";

// ─── Shared types ────────────────────────────────────────────────────────────

const formToPayload = (form: FormState): EquipmentPayload => ({
    ...form,
    target_muscles: form.target_muscles.join(","),
});

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({
    title,
    icon,
    onClose,
    onConfirm,
    confirmLabel,
    confirmDanger = false,
    saving,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
    confirmLabel: string;
    confirmDanger?: boolean;
    saving: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.15s_ease]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`bg-surface border rounded-2xl w-full max-w-[460px] max-h-[90vh] flex flex-col overflow-hidden
                    animate-[slideUp_0.2s_ease]
                    ${confirmDanger ? "border-danger/25" : "border-border"}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-border shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center border
                            ${
                                confirmDanger
                                    ? "bg-danger/10 border-danger/30"
                                    : "bg-primary/10 border-primary/25"
                            }`}
                        >
                            {icon}
                        </div>
                        <h3 className="text-sm font-extrabold text-text-primary">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border transition-colors duration-150 cursor-pointer"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 overflow-y-auto flex flex-col gap-4 flex-1">
                    {children}
                </div>

                {/* Footer */}
                <div className="flex gap-2 justify-end px-5 py-3.5 border-t border-border shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-border text-text-secondary text-xs font-semibold
                                   hover:border-border/80 hover:text-text-primary transition-all duration-150 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={saving}
                        className={`px-5 py-2 rounded-xl text-xs font-extrabold tracking-wide flex items-center gap-1.5
                                    transition-colors duration-150 disabled:cursor-not-allowed
                            ${
                                confirmDanger
                                    ? "bg-danger hover:bg-red-600 text-white disabled:bg-danger/40"
                                    : "bg-primary hover:bg-primary-dark text-background disabled:bg-primary/30"
                            }`}
                    >
                        {saving && (
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="animate-spin"
                            >
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                        )}
                        {saving ? "Please wait..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

export function AddModal({
    onCreate,
    onClose,
}: {
    onCreate: (payload: EquipmentPayload) => Promise<void>;
    onClose: () => void;
}) {
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!form.equipment_name.trim()) {
            setError("Equipment name is required.");
            return;
        }
        if (form.target_muscles.length === 0) {
            setError("Select at least one muscle group.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onCreate(formToPayload(form));
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title="Add Equipment"
            icon={
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#7cff00"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            }
            onClose={onClose}
            onConfirm={handleConfirm}
            confirmLabel="Add Equipment"
            saving={saving}
        >
            <EquipmentForm form={form} setForm={setForm} error={error} />
        </Modal>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

export function EditModal({
    item,
    onUpdate,
    onClose,
}: {
    item: EquipmentTypes;
    onUpdate: (id: number, payload: Partial<EquipmentPayload>) => Promise<void>;
    onClose: () => void;
}) {
    const [form, setForm] = useState<FormState>({
        equipment_name: item.equipment_name,
        category: item.category,
        target_muscles: item.target_muscles
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
        description: item.description ?? "",
        quantity: item.quantity ?? 1,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!form.equipment_name.trim()) {
            setError("Equipment name is required.");
            return;
        }
        if (form.target_muscles.length === 0) {
            setError("Select at least one muscle group.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onUpdate(item.id, formToPayload(form));
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title="Edit Equipment"
            icon={
                <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#7cff00"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            }
            onClose={onClose}
            onConfirm={handleConfirm}
            confirmLabel="Save Changes"
            saving={saving}
        >
            <EquipmentForm form={form} setForm={setForm} error={error} />
        </Modal>
    );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

export function DeleteModal({
    item,
    onDelete,
    onClose,
}: {
    item: EquipmentTypes;
    onDelete: (id: number) => Promise<void>;
    onClose: () => void;
}) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setDeleting(true);
        setError(null);
        try {
            await onDelete(item.id);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete.");
            setDeleting(false);
        }
    };

    return (
        <Modal
            title="Delete Equipment"
            icon={
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ff3b3b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                </svg>
            }
            onClose={onClose}
            onConfirm={handleConfirm}
            confirmLabel="Delete"
            confirmDanger
            saving={deleting}
        >
            <p className="text-sm text-text-secondary leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="text-text-primary font-bold">
                    {item.equipment_name}
                </span>
                ? This action cannot be undone.
            </p>
            {error && (
                <p className="text-xs text-danger">{error}</p>
            )}
        </Modal>
    );
}
