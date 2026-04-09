import type { EquipmentTypes } from "../../hooks/useEquipments";
import { getMuscleStyle } from "./equipmentConstants";

// ─── Category Badge ───────────────────────────────────────────────────────────

export function CategoryBadge({ category }: { category: string }) {
    return (
        <span className="shrink-0 text-[0.6rem] font-bold tracking-widest uppercase text-primary bg-primary/8 rounded px-2 py-0.5 whitespace-nowrap">
            {category}
        </span>
    );
}

// ─── Muscle Tag ───────────────────────────────────────────────────────────────

export function MuscleTag({ muscle }: { muscle: string }) {
    const s = getMuscleStyle(muscle);
    return (
        <span
            className={`text-[0.65rem] font-semibold tracking-wide ${s.text} ${s.bg} rounded px-1.5 py-0.5 whitespace-nowrap`}
        >
            {muscle.trim()}
        </span>
    );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

export function SkeletonRow() {
    return (
        <tr className="border-b border-border">
            <td className="px-5 py-4">
                <div className="h-3 w-10 rounded bg-border animate-pulse" />
            </td>
            <td className="px-5 py-4">
                <div className="h-3.5 w-36 rounded bg-border animate-pulse" />
            </td>
            <td className="px-5 py-4">
                <div className="h-5 w-20 rounded bg-border animate-pulse" />
            </td>
            <td className="px-5 py-4">
                <div className="h-3 w-8 rounded bg-border animate-pulse" />
            </td>
            <td className="px-5 py-4">
                <div className="flex gap-1.5">
                    {[52, 44].map((w, i) => (
                        <div
                            key={i}
                            className="h-5 rounded bg-border animate-pulse"
                            style={{ width: w }}
                        />
                    ))}
                </div>
            </td>
            <td className="px-5 py-4">
                <div className="h-3 w-36 rounded bg-border animate-pulse" />
            </td>
            <td className="px-5 py-4">
                <div className="ml-auto h-8 w-20 rounded bg-border animate-pulse" />
            </td>
        </tr>
    );
}

// ─── Equipment Row ────────────────────────────────────────────────────────────

export default function EquipmentRow({
    item,
    onEdit,
    onDelete,
}: {
    item: EquipmentTypes;
    onEdit: (item: EquipmentTypes) => void;
    onDelete: (item: EquipmentTypes) => void;
}) {
    const muscles = item.target_muscles.split(",").filter(Boolean);

    return (
        <tr className="border-b border-border hover:bg-surface/70 transition-colors">
            <td className="px-5 py-4 text-xs text-text-secondary font-semibold">
                {item.id}
            </td>

            <td className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-text-primary">
                        {item.equipment_name}
                    </span>
                </div>
            </td>

            <td className="px-5 py-4">
                <CategoryBadge category={item.category} />
            </td>
            <td className="px-5 py-4 text-sm font-semibold text-text-primary">
                {item.quantity ?? "-"}
            </td>
            <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1.5 max-w-xs">
                    {muscles.map((m) => (
                        <MuscleTag key={m} muscle={m} />
                    ))}
                </div>
            </td>
            <td className="px-5 py-4 max-w-sm">
                <p className="text-xs text-text-secondary line-clamp-2">
                    {item.description?.trim() || "-"}
                </p>
            </td>
            <td className="px-5 py-4">
                <div className="flex gap-1.5 justify-end">
                    <button
                        title="Edit"
                        onClick={() => onEdit(item)}
                        className="px-2.5 py-1.5 rounded-lg border border-border text-text-secondary
                                   hover:border-primary/30 hover:bg-primary/10 hover:text-primary
                                   transition-all duration-150 cursor-pointer text-xs font-semibold"
                    >
                        Edit
                    </button>
                    <button
                        title="Delete"
                        onClick={() => onDelete(item)}
                        className="px-2.5 py-1.5 rounded-lg border border-border text-text-secondary
                                   hover:border-danger/40 hover:bg-danger/10 hover:text-danger
                                   transition-all duration-150 cursor-pointer text-xs font-semibold"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}
