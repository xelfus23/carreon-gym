import { Edit, Trash } from "lucide-react";
import type { EquipmentTypes } from "../../hooks/useEquipments";
import type { ActionItemProps } from "../../types";
import { useCallback, useRef, useState } from "react";
import { ActionMenu } from "../ActionMenu";
import { getMuscleStyle } from "../../constants";

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
      className={`text-[0.65rem] font-semibold tracking-wide ${s.text} ${s.bg} px-1.5 py-0.5 whitespace-nowrap`}
    >
      {muscle.trim()}
    </span>
  );
}

// ─── Equipment Row ────────────────────────────────────────────────────────────

export default function EquipmentRow({
  item,
  onEdit,
  onDelete,
}: {
  item: EquipmentTypes;
  onEdit: (e: EquipmentTypes) => void;
  onDelete: (e: EquipmentTypes) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setMenuOpen(false), []);

  // const muscles = (item.target_muscles ?? "")
  //   .split(",")
  //   .map((muscle) => muscle.trim())
  //   .filter(Boolean);

  const actions: ActionItemProps[] = [
    {
      label: "Edit",
      onClick: () => {
        onEdit(item);
        close();
      },
      icon: <Edit size={16} />,
    },
    {
      label: "Delete",
      onClick: () => {
        onDelete(item); //
        close();
      },
      icon: <Trash size={16} />,
      dividerBefore: true,
      variant: "danger",
    },
  ];

  return (
    <tr className={`transition-colors group hover:bg-border/40`}>
      <td className="p-3 text-xs text-text-secondary">{item.id.toString()}</td>

      <td className="p-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-text-primary">
            {item.equipment_name}
          </span>
        </div>
      </td>

      <td className="p-3">
        <CategoryBadge category={item.category} />
      </td>
      <td className="text-sm font-semibold text-text-primary">
        {item.quantity ?? "-"}
      </td>

      <td className="p-3">
        <div className="flex items-center justify-end">
          <button
            ref={triggerRef}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Member actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all
                            opacity-0 group-hover:opacity-100 focus:opacity-100
                            ${menuOpen
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
