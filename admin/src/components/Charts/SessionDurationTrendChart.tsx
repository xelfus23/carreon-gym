/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { UserAccountProps } from "../../types";
import { COLORS } from "../../constants";

interface SessionDurationTrendChartProps {
  user: UserAccountProps;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-bold text-text-primary">{row.weekLabel}</p>
      <p className="text-text-secondary mt-0.5">
        Avg session:{" "}
        {row.avgMinutes != null ? `${row.avgMinutes} min` : "no data"}
      </p>
      <p className="text-text-secondary mt-0.5">
        {row.sessionCount} {row.sessionCount === 1 ? "visit" : "visits"}
      </p>
    </div>
  );
}

export default function SessionDurationTrendChart({
  user,
}: SessionDurationTrendChartProps) {
  const data = useMemo(() => {
    const logs = user.attendance_logs ?? [];

    // Bucket by ISO week (Mon start) across the full log history
    const weekBuckets: Record<string, number[]> = {};

    logs.forEach((log) => {
      if (!log.check_out) return;
      const inDate = new Date(log.check_in);
      const outDate = new Date(log.check_out);
      if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime()))
        return;

      const mins = (outDate.getTime() - inDate.getTime()) / 60000;
      if (mins <= 0 || mins > 6 * 60) return; // discard bad/outlier data

      // Anchor to the Monday of that week
      const weekStart = new Date(inDate);
      const dayOfWeek = (weekStart.getDay() + 6) % 7; // Mon=0
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const key = weekStart.toISOString().slice(0, 10);

      if (!weekBuckets[key]) weekBuckets[key] = [];
      weekBuckets[key].push(mins);
    });

    const sortedKeys = Object.keys(weekBuckets).sort();

    return sortedKeys.map((key) => {
      const mins = weekBuckets[key];
      const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
      const d = new Date(key);
      return {
        weekLabel: `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        shortLabel: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        avgMinutes: Math.round(avg),
        sessionCount: mins.length,
      };
    });
  }, [user.attendance_logs]);

  if (data.length === 0) {
    return (
      <div className="bg-surface p-5 rounded-xl border border-border">
        <p className="text-sm text-text-secondary py-6 text-center">
          Not enough completed sessions to chart a trend yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface p-5 rounded-xl border border-border">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={COLORS.border}
            vertical={false}
          />
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={COLORS.border}
            vertical={true}
          />
          <XAxis
            dataKey="shortLabel"
            tick={{ fontSize: 10, fill: COLORS.textSecondary }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
            interval={data.length > 10 ? Math.ceil(data.length / 8) : 0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: COLORS.textSecondary }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}m`}
            width={36}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: COLORS.border }}
          />
          <Line
            type="monotone"
            dataKey="avgMinutes"
            stroke={COLORS.primaryDark}
            strokeWidth={2}
            dot={{ r: 3, fill: "#534AB7" }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
