import { PLAN_COLORS } from "../../constants";

interface PlanStat {
  plan_name: string;
  count: number;
  percent: number;
}

const PlanBar: React.FC<{ plan: PlanStat; index: number; total: number }> = ({
  plan,
  index,
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-secondary truncate pr-2">
        {plan.plan_name}
      </span>
      <span className="text-xs font-bold text-text-primary shrink-0">
        {plan.count.toLocaleString()}
        <span className="font-normal text-text-secondary ml-1">
          ({plan.percent}%)
        </span>
      </span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${plan.percent}%`,
          backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length],
        }}
      />
    </div>
  </div>
);

export default PlanBar