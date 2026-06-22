/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { UserAccountProps } from "../../types";
import { COLORS } from "../../constants";

interface CheckInTimelineChartProps {
  user: UserAccountProps;
  daysToShow?: number;
}

function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function formatTime(hoursFloat: number) {
  const h = Math.floor(hoursFloat);
  const m = Math.round((hoursFloat - h) * 60);

  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;

  return `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;

  if (!row || row.sessions.length === 0) return null;

  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-md space-y-1">
      <p className="font-bold text-text-primary">{row.dateLabel}</p>

      {row.sessions.map((s: any, i: number) => (
        <p key={i} className="text-text-secondary">
          {formatTime(s.inHour)} –{" "}
          {s.outHour !== null ? formatTime(s.outHour) : "ongoing"}
          {s.outHour !== null && <span> · {s.durationLabel}</span>}
        </p>
      ))}
    </div>
  );
}

export default function CheckInTimelineChart({
  user,
  daysToShow = 14,
}: CheckInTimelineChartProps) {
  const rows = useMemo(() => {
    const logs = user.attendance_logs ?? [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayKey = localDateKey(today);

    const dayBuckets: Record<
      string,
      {
        inHour: number;
        outHour: number | null;
        durationLabel: string;
      }[]
    > = {};

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);

      dayBuckets[localDateKey(d)] = [];
    }

    logs.forEach((log) => {
      const inDate = new Date(log.check_in);

      if (Number.isNaN(inDate.getTime())) return;

      const key = localDateKey(inDate);

      if (!(key in dayBuckets)) return;

      const inHour = inDate.getHours() + inDate.getMinutes() / 60;

      let outHour: number | null = null;
      let durationLabel = "—";

      if (log.check_out) {
        const outDate = new Date(log.check_out);

        if (!Number.isNaN(outDate.getTime())) {
          outHour = outDate.getHours() + outDate.getMinutes() / 60;

          const mins = Math.round(
            (outDate.getTime() - inDate.getTime()) / 60000,
          );

          durationLabel =
            mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
        }
      }

      dayBuckets[key].push({
        inHour,
        outHour,
        durationLabel,
      });
    });

    return Object.entries(dayBuckets)
      .map(([key, sessions]) => {
        const d = new Date(`${key}T00:00:00`);

        const isToday = key === todayKey;

        const validSessions = sessions.filter((s) => s.outHour !== null);

        const CHART_START_HOUR = 5;

        const startHour = sessions.length
          ? Math.min(...sessions.map((s) => s.inHour))
          : 0;

        const endHour = validSessions.length
          ? Math.max(...validSessions.map((s) => s.outHour as number))
          : startHour;

        const duration = sessions.length
          ? Math.max(endHour - startHour, 0.5)
          : 0;

        return {
          rowId: key,

          isToday,

          fill: isToday ? "#3b82f6" : "#10b981",

          dateLabel: isToday
            ? `Today • ${d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}`
            : d.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),

          shortLabel: isToday
            ? "Today"
            : d.toLocaleDateString("en-US", {
                weekday: "short",
              }),

          sessions,
          startHour,
          duration,
          timeRange:
            sessions.length && endHour > startHour
              ? [startHour, endHour]
              : null,
        };
      })
      .reverse();
  }, [user.attendance_logs, daysToShow]);

  const hasAnyData = rows.some((r) => r.sessions.length > 0);

  return (
    <div className="bg-surface p-5 rounded-xl border border-border">
      {!hasAnyData ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          No check-ins recorded in this period.
        </p>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(rows.length * 28 + 40, 220)}
        >
          <BarChart
            data={rows}
            layout="vertical"
            margin={{
              top: 4,
              right: 16,
              left: 4,
              bottom: 4,
            }}
            barCategoryGap={6}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.border}
              vertical={false}
              className="pointer-events-none"
            />

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.border}
              vertical={true}
              className="pointer-events-none"
            />

            <XAxis
              type="number"
              domain={[5, 23]}
              ticks={[6, 9, 12, 15, 18, 21]}
              tickFormatter={(v) => formatTime(v)}
              tick={{
                fontSize: 10,
                fill: COLORS.textSecondary,
              }}
              axisLine={{
                stroke: COLORS.border,
              }}
              tickLine={{
                stroke: COLORS.border,
              }}
            />

            <YAxis
              type="category"
              dataKey="rowId"
              width={60}
              tickFormatter={(value) => {
                const row = rows.find((r) => r.rowId === value);

                if (!row) return "";

                return row.isToday ? "● Today" : row.shortLabel;
              }}
              tick={{
                fontSize: 10,
                fill: COLORS.textSecondary,
              }}
              axisLine={{
                stroke: COLORS.border,
              }}
              tickLine={{
                stroke: COLORS.border,
              }}
            />

            <Tooltip cursor={false} content={<CustomTooltip />} />

            <Bar dataKey="timeRange" radius={4} isAnimationActive={false}>
              {rows.map((row) => (
                <Cell key={row.rowId} fill={row.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
