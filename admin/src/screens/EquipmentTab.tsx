import { useState } from "react";
import {
    useEquipments,
    type EquipmentTypes,
} from "../hooks/useEquipments";
import { EquipmentCard, SkeletonCard } from "../components/equipment/EquipmentCard";
import { AddModal, EditModal, DeleteModal } from "../components/equipment/EquipmentModals";

// ─── Animations (scoped to this tab) ─────────────────────────────────────────

const KEYFRAMES = `
    @keyframes fadeSlideIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(16px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
    }
`;

// ─── Equipment Tab ─────────────────────────────────────────────────────────────

export default function EquipmentTab() {
    const {
        equipments,
        isLoading,
        error,
        refresh,
        createEquipment,
        updateEquipment,
        deleteEquipment,
    } = useEquipments();

    const [showAdd, setShowAdd] = useState(false);
    const [editTarget, setEditTarget] = useState<EquipmentTypes | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EquipmentTypes | null>(null);

    return (
        <>
            <style>{KEYFRAMES}</style>

            <div className="flex flex-col gap-4">
                {/* ── Toolbar ── */}
                <div className="flex items-center justify-between">
                    {!isLoading && !error && (
                        <p className="text-xs text-text-secondary">
                            {equipments.length} item{equipments.length !== 1 ? "s" : ""} available
                        </p>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                        {!isLoading && (
                            <button
                                onClick={refresh}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border
                                           text-text-secondary text-xs font-semibold uppercase tracking-wider
                                           hover:border-primary/40 hover:text-primary transition-all duration-150"
                            >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 4 23 10 17 10" />
                                    <polyline points="1 20 1 14 7 14" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                                Refresh
                            </button>
                        )}
                        <button
                            onClick={() => setShowAdd(true)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark
                                       text-background text-xs font-bold tracking-wide transition-colors duration-150"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Equipment
                        </button>
                    </div>
                </div>

                {/* ── Error banner ── */}
                {error && (
                    <div className="flex items-center gap-2.5 bg-danger/8 border border-danger/30 rounded-2xl px-4 py-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3b3b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p className="text-sm text-danger font-medium">{error}</p>
                    </div>
                )}

                {/* ── List ── */}
                <div className="flex flex-col gap-2.5">
                    {isLoading
                        ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                        : equipments.map((eq, i) => (
                              <EquipmentCard
                                  key={eq.id}
                                  item={eq}
                                  index={i}
                                  onEdit={setEditTarget}
                                  onDelete={setDeleteTarget}
                              />
                          ))}
                </div>

                {/* ── Empty state ── */}
                {!isLoading && !error && equipments.length === 0 && (
                    <div className="flex flex-col items-center py-16 text-text-secondary gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                        </div>
                        <p className="text-sm text-text-secondary text-center">No equipment found</p>
                        <button
                            onClick={() => setShowAdd(true)}
                            className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30
                                       text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                        >
                            + Add your first equipment
                        </button>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {showAdd && (
                <AddModal onCreate={createEquipment} onClose={() => setShowAdd(false)} />
            )}
            {editTarget && (
                <EditModal
                    item={editTarget}
                    onUpdate={updateEquipment}
                    onClose={() => setEditTarget(null)}
                />
            )}
            {deleteTarget && (
                <DeleteModal
                    item={deleteTarget}
                    onDelete={deleteEquipment}
                    onClose={() => setDeleteTarget(null)}
                />
            )}
        </>
    );
}
