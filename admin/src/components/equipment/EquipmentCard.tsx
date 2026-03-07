import type { EquipmentTypes } from "../../hooks/useEquipments";
import { getMuscleStyle } from "./equipmentConstants";

// ─── Barbell Icon ─────────────────────────────────────────────────────────────

function BarbellIcon() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7cff00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect
                x="2"
                y="6"
                width="4"
                height="12"
                rx="1"
                fill="rgba(124,255,0,0.15)"
                stroke="#7cff00"
                strokeWidth="1.5"
            />
            <rect
                x="18"
                y="6"
                width="4"
                height="12"
                rx="1"
                fill="rgba(124,255,0,0.15)"
                stroke="#7cff00"
                strokeWidth="1.5"
            />
            <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2.5" />
        </svg>
    );
}

// ─── Category Badge ───────────────────────────────────────────────────────────

export function CategoryBadge({ category }: { category: string }) {
    return (
        <span className="shrink-0 text-[0.6rem] font-bold tracking-widest uppercase text-primary bg-primary/8 border border-primary/25 rounded px-2 py-0.5 whitespace-nowrap">
            {category}
        </span>
    );
}

// ─── Muscle Tag ───────────────────────────────────────────────────────────────

export function MuscleTag({ muscle }: { muscle: string }) {
    const s = getMuscleStyle(muscle);
    return (
        <span
            className={`text-[0.65rem] font-semibold tracking-wide ${s.text} ${s.bg} border ${s.border} rounded px-1.5 py-0.5 whitespace-nowrap`}
        >
            {muscle.trim()}
        </span>
    );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

export function SkeletonCard() {
    return (
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-border animate-pulse shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3.5 w-[55%] rounded bg-border/60 animate-pulse" />
                    <div className="h-2.5 w-[30%] rounded bg-border animate-pulse" />
                </div>
                <div className="h-4.5 w-16 rounded bg-border animate-pulse" />
            </div>
            <div className="flex gap-1.5 pl-12">
                {[48, 62, 54].map((w, i) => (
                    <div
                        key={i}
                        className="h-5 rounded bg-border animate-pulse"
                        style={{ width: w }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Equipment Card ───────────────────────────────────────────────────────────

export function EquipmentCard({
    item,
    index,
    onEdit,
    onDelete,
}: {
    item: EquipmentTypes;
    index: number;
    onEdit: (item: EquipmentTypes) => void;
    onDelete: (item: EquipmentTypes) => void;
}) {
    const muscles = item.target_muscles.split(",").filter(Boolean);

    return (
        <div
            className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2.5
                       transition-all duration-200 hover:border-primary/30 hover:shadow-[0_6px_24px_rgba(124,255,0,0.06)]"
            style={{
                animationDelay: `${index * 40}ms`,
                animation: "fadeSlideIn 0.35s ease both",
            }}
        >
            {/* Row: icon + name + qty + badge + actions */}
            <div className="flex items-center gap-2.5">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl shrink-0 bg-primary/[0.07] border border-primary/20 flex items-center justify-center">
                    <BarbellIcon />
                </div>

                {/* Name + qty */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary tracking-wide truncate">
                        {item.equipment_name}
                    </p>
                    {item.quantity != null && (
                        <p className="text-xs text-text-secondary font-medium mt-px">
                            Qty: {item.quantity}
                        </p>
                    )}
                </div>

                <CategoryBadge category={item.category} />

                {/* Actions */}
                <div className="flex gap-1.5 shrink-0">
                    <button
                        title="Edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                        }}
                        className="p-1.5 rounded-lg border border-border text-text-secondary
                                   hover:border-primary/30 hover:bg-primary/10 hover:text-primary
                                   transition-all duration-150 cursor-pointer"
                    >
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                    <button
                        title="Delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                        }}
                        className="p-1.5 rounded-lg border border-border text-text-secondary
                                   hover:border-danger/40 hover:bg-danger/10 hover:text-danger
                                   transition-all duration-150 cursor-pointer"
                    >
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Description */}
            {item.description && (
                <p className="text-xs text-text-secondary leading-relaxed pl-12">
                    {item.description}
                </p>
            )}

            {/* Muscle tags */}
            {muscles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-12">
                    {muscles.map((m) => (
                        <MuscleTag key={m} muscle={m} />
                    ))}
                </div>
            )}
        </div>
    );
}
