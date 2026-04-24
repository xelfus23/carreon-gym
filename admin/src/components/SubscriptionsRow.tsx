import type { SubscriptionPlanProps } from '../types'
import { Calendar, CheckCircle, EllipsisVertical } from 'lucide-react'
import { useGymSubs } from '../hooks/useGymSubs';
import { formatSlug } from '../utils/formatSlug';

const CATEGORY_COLORS = { personal_training: "text-violet-500 bg-violet-500/10 ", membership: "text-emerald-500 bg-emerald-500/10", class: "text-amber-500 bg-amber-500/10", add_on: "text-blue-500 bg-blue-500/10" }

export default function SubscriptionsRow({ plan, onClick }: { plan: SubscriptionPlanProps, onClick: () => void }) {

  const {
    formatCurrency,
  } = useGymSubs();

  return (
    <tr
      key={plan.id}
      className="hover:bg-border/10 transition-colors group"
    >
      <td className="px-6 py-4">
        <p className="font-bold text-sm tracking-tight text-text-primary">
          {plan.id}
        </p>
      </td>
      <td className="px-6 py-4">
        <p className="font-bold text-sm tracking-tight text-text-primary">
          {plan.name}
        </p>
      </td>
      <td className="px-6 py-4">
        <p className="text-xs text-text-secondary line-clamp-1">
          {plan.description}
        </p>
      </td>
      <td className="px-6 py-4">
        <span
          className={`px-2 py-1 text-xs font-bold tracking-tighter ${CATEGORY_COLORS[plan.category]}`}
        >
          {formatSlug(plan.category)}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calendar size={14} className="text-text-secondary" />
          {plan.duration_days}{" "}
          {plan.duration_days > 1 ? "Days" : "Day"}
        </div>
      </td>
      <td className="px-6 py-4 text-xs text-text-secondary">
        {formatCurrency(plan.price)}
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 text-emerald-500 text-[11px] font-black">
          <CheckCircle size={14} /> Active
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative inline-flex">
          <button
            onClick={onClick}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-border/50 transition-colors"
          >
            <EllipsisVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}
