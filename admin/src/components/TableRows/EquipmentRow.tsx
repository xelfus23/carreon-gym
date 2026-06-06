import { Edit, Trash } from "lucide-react";
import type { ActionItemProps, EquipmentProps } from "../../types";
import { useCallback, useRef, useState } from "react";
import { ActionMenu } from "../ActionMenu";
import { getMuscleStyle } from "../../constants";

// ─── Category Badge ───────────────────────────────────────────────────────────

const categoryMap: Record<string, string> = {
  Accessory: "text-emerald-500",
  ["Free Weight"]: "text-amber-500",
  Cardio: "text-indigo-500",
  Machine: "text-sky-500",
};

export function CategoryBadge({ category }: { category: string }) {
  const color = categoryMap[category];

  return (
    <span
      className={`shrink-0 text-[0.6rem] font-bold tracking-widest uppercase ${color} rounded px-2 py-0.5 whitespace-nowrap`}
    >
      {category}
    </span>
  );
}

// ─── Muscle Tag ───────────────────────────────────────────────────────────────

export function MuscleTag({ muscle }: { muscle: string }) {
  const s = getMuscleStyle(muscle);
  return (
    <span
      className={`text-[0.65rem] font-semibold tracking-wide ${s.text} ${s.bg} px-1.5 py-0.5 whitespace-nowrap`}
    >
      {muscle.trim()}
    </span>
  );
}

// ─── Equipment Row ────────────────────────────────────────────────────────────

export default function EquipmentRow({
  equipment,
  onEdit,
  onDelete,
}: {
  equipment: EquipmentProps;
  onEdit: (e: EquipmentProps) => void;
  onDelete: (e: EquipmentProps) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setMenuOpen(false), []);
  const previewUrl = equipment.icon_url ?? null;

  const actions: ActionItemProps[] = [
    {
      label: "Edit",
      onClick: () => {
        onEdit(equipment);
        close();
      },
      icon: <Edit size={16} />,
    },
    {
      label: "Delete",
      onClick: () => {
        onDelete(equipment); //
        close();
      },
      icon: <Trash size={16} />,
      dividerBefore: true,
      variant: "danger",
    },
  ];

  return (
    <tr className={`transition-colors group hover:bg-border/40`}>
      <td className="p-4 text-xs text-text-secondary">
        {equipment.id.toString()}
      </td>
      <td className="p-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={equipment.equipment_name}
            className="h-10 w-10 rounded-md object-cover border border-border bg-background"
            loading="lazy"
          />
        ) : (
          <div className="h-10 w-10 rounded-md border text border-border bg-background items-center p-2 justify-center flex">
            <p className="text-[8px] text-center text-text-secondary">
              No Image
            </p>
          </div>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-text-primary">
            {equipment.equipment_name}
          </span>
        </div>
      </td>

      <td className="p-4">
        <CategoryBadge category={equipment.category} />
      </td>

      <td className="p-4 text-sm font-semibold text-text-primary">
        {equipment.quantity ?? "-"}
      </td>

      <td className="p-4">
        <div className="flex items-center justify-end">
          <button
            ref={triggerRef}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Member actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all
                            opacity-0 group-hover:opacity-100 focus:opacity-100
                            ${
                              menuOpen
                                ? "opacity-100 bg-border text-text-primary"
                                : "text-text-secondary hover:bg-border hover:text-text-primary"
                            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.4" />
              <circle cx="8" cy="8" r="1.4" />
              <circle cx="8" cy="13" r="1.4" />
            </svg>
          </button>

          {menuOpen && (
            <ActionMenu
              items={actions}
              anchorRef={triggerRef}
              onClose={close}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
