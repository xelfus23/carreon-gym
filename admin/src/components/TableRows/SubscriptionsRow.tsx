import { CheckCircle, Edit } from "lucide-react";
import type { ActionItemProps, SubscriptionPlanProps } from "../../types";
import { formatSlug } from "../../utils/formatSlug";
import { formatCurrency } from "../../utils/formatCurrency";
import { useCallback, useRef, useState } from "react";
import { ActionMenu } from "../ActionMenu";

const CATEGORY_COLORS = {
  personal_training: "text-violet-50",
  membership: "text-emerald-500",
  class: "text-amber-500",
  add_on: "text-blue-500",
};

export default function SubscriptionsRow({
  plan,
  onClick,
}: {
  plan: SubscriptionPlanProps;
  onClick: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setMenuOpen(false), []);

  const actions: ActionItemProps[] = [
    {
      label: "Edit",
      onClick: () => {
        onClick();
        close();
      },
      icon: <Edit />,
    },
  ];

  return (
    <tr key={plan.id} className={`transition-colors group hover:bg-border/40`}>
      <td className="p-4 text-xs text-text-secondary">{plan.id.toString()}</td>
      <td className="p-4">
        <p className="font-bold text-sm tracking-tight text-text-primary">
          {plan.name}
        </p>
      </td>
      <td className="p-4">
        <p className="text-xs text-text-secondary line-clamp-1">
          {plan.description}
        </p>
      </td>
      <td className="p-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs font-bold tracking-tighter  ${CATEGORY_COLORS[plan.category]}`}
        >
          {formatSlug(plan.category)}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap text-xs">
        {plan.duration_days} {plan.duration_days > 1 ? "Days" : "Day"}
      </td>
      <td className="p-4 text-xs text-text-secondary">
        {formatCurrency(plan.price)}
      </td>
      <td className="p-4">
        <span className="inline-flex items-center gap-1.5 text-emerald-500 text-[11px] font-black">
          <CheckCircle size={14} /> Active
        </span>
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
