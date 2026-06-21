/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { UserAccountProps } from "../../types";
import { COLORS } from "../../constants";

interface SubscriptionTimelineChartProps {
  user: UserAccountProps;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#1D9E75",
  expired: "#E24B4A",
  pending: "#EF9F27",
  cancelled: "#888780",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  pending: "Pending",
  cancelled: "Cancelled",
};

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-bold text-text-primary">{row.plan_name}</p>
      <p className="text-text-secondary mt-0.5">
        {formatDate(row.startMs)} → {formatDate(row.endMs)}
      </p>
      <p className="text-text-secondary mt-0.5">
        {row.totalMonths} {row.totalMonths === 1 ? "month" : "months"} · {STATUS_LABELS[row.status] ?? row.status}
      </p>
    </div>
  );
}

// Replaces the deprecated Cell-per-bar pattern: reads each row's own color via the shape prop
function DurationBarShape(props: any) {
  const { x, y, width, height, payload } = props;
  const radius = 4;
  return (
    <rect
      x={x}
      y={y}
      width={Math.max(width, 0)}
      height={height}
      rx={radius}
      ry={radius}
      fill={payload?.color ?? "#888780"}
    />
  );
}

export default function SubscriptionTimelineChart({ user }: SubscriptionTimelineChartProps) {
  const { rows, domain } = useMemo(() => {
    const subs = user.subscriptions ?? [];
    if (subs.length === 0) return { rows: [], domain: [0, 1] as [number, number] };

    const parsed = subs
      .map((sub) => {
        const startMs = new Date(sub.start_date || "").getTime();
        const endMs = new Date(sub.expiry_date || "").getTime();
        return { sub, startMs, endMs };
      })
      .filter((r) => Number.isFinite(r.startMs) && Number.isFinite(r.endMs));

    if (parsed.length === 0) return { rows: [], domain: [0, 1] as [number, number] };

    const minTime = Math.min(...parsed.map((r) => r.startMs));
    const maxTime = Math.max(...parsed.map((r) => r.endMs));

    // Sort chronologically, oldest at top reads more naturally for history
    parsed.sort((a, b) => a.startMs - b.startMs);

    const rows = parsed.map(({ sub, startMs, endMs }) => {
      const durationMs = endMs - startMs;
      const totalMonths = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24 * 30)));
      return {
        plan_name: sub.plan_name,
        status: sub.status,
        startMs,
        endMs,
        // "offset" is an invisible spacer bar so the visible bar floats to the right position
        offset: startMs - minTime,
        duration: endMs - startMs,
        totalMonths,
        color: STATUS_COLORS[sub.status] ?? COLORS.textSecondary,
      };
    });

    return { rows, domain: [0, maxTime - minTime] as [number, number] };
  }, [user.subscriptions]);

  if (rows.length === 0) {
    return (
      <div className="bg-surface p-5 rounded-xl border border-border">
        <p className="text-sm text-text-secondary py-6 text-center">No subscription history for this member yet.</p>
      </div>
    );
  }

  const minTime = rows[0].startMs - rows[0].offset;

  return (
    <div className="bg-surface p-5 rounded-xl border border-border">
      <div className="flex flex-wrap gap-4 pb-4 mb-1 border-b border-border text-[11px] text-text-secondary ">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[key] }} />
            {label}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={Math.max(rows.length * 44 + 40, 140)}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
          barCategoryGap={10}
        >
          <XAxis
            type="number"
            domain={domain}
            tickFormatter={(v: number) => formatDate(minTime + v)}
            tick={{ fontSize: 10, fill: COLORS.textSecondary }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="plan_name"
            width={110}
            tick={{ fontSize: 11, fill: COLORS.textSecondary }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: COLORS.surface }} />
          <Bar dataKey="offset" stackId="a" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="duration" stackId="a" shape={DurationBarShape} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}