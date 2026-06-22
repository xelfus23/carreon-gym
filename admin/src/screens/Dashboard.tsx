import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useStats } from "../hooks/useStats";
import { COLORS } from "../constants";

type AttendanceView = "weekly" | "monthly";

const tooltipStyle: React.CSSProperties = {
  borderRadius: "12px",
  border: "1px solid #2A2A2A",
  backgroundColor: "#1A1A1A",
  color: "#FFFFFF",
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.4)",
};

const PLAN_COLORS = ["#7CFF00", "#FBBF24", "#60A5FA", "#A78BFA", "#F472B6"];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatHour = (h: number): string => {
  if (h === 0) return "12AM";
  if (h < 12) return `${h}AM`;
  if (h === 12) return "12PM";
  return `${h - 12}PM`;
};

const formatCurrency = (v: number) =>
  `₱${v.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;

// ── Sub-components ────────────────────────────────────────────────────────────

const ChartSkeleton: React.FC = () => (
  <div className="h-full flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
  </div>
);

const NoDataState: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-full flex items-center justify-center text-text-secondary text-sm">
    {message}
  </div>
);

const StatCard: React.FC<{
  title: string;
  value: string;
  trend: string;
  color: string;
  loading?: boolean;
}> = ({ title, value, trend, color, loading }) => {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };

  return (
    <div className="bg-surface p-6 border border-border shadow-sm">
      <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
      <h2
        className={`text-3xl font-black text-text-primary mb-3 transition-opacity ${
          loading ? "opacity-30 animate-pulse" : "opacity-100"
        }`}
      >
        {value}
      </h2>
      <p
        className={`text-xs font-semibold ${colorMap[color] ?? "text-text-secondary"}`}
      >
        {trend}
      </p>
    </div>
  );
};

const MetricTile: React.FC<{
  label: string;
  value: string;
  icon: string;
  loading?: boolean;
  alert?: boolean;
  positive?: boolean;
}> = ({ label, value, icon, loading, alert, positive }) => (
  <div
    className={`bg-surface p-5 border shadow-sm flex items-center gap-4 ${
      alert ? "border-amber-500/40" : "border-border"
    }`}
  >
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="text-xs text-text-secondary font-medium">{label}</p>
      <p
        className={`text-xl font-black mt-0.5 transition-opacity ${
          loading
            ? "opacity-30 animate-pulse text-text-primary"
            : positive === undefined
              ? alert
                ? "text-amber-400"
                : "text-text-primary"
              : positive
                ? "text-emerald-400"
                : "text-rose-400"
        }`}
      >
        {value}
      </p>
    </div>
  </div>
);

// ── Attendance toggle tabs ────────────────────────────────────────────────────

const ViewToggle: React.FC<{
  value: AttendanceView;
  onChange: (v: AttendanceView) => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
    {(["weekly", "monthly"] as AttendanceView[]).map((v) => (
      <button
        key={v}
        onClick={() => onChange(v)}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all capitalize ${
          value === v
            ? "bg-surface text-text-primary shadow-sm"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        {v}
      </button>
    ))}
  </div>
);

// ── Recent payment row ────────────────────────────────────────────────────────

interface RecentPayment {
  member_name: string;
  amount: number;
  method: string;
  transaction_type: string;
  item_name: string;
  status: "paid" | "pending" | "refunded" | "cancelled" | "rejected";
  paid_at: string | null;
  initials: string;
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid: "text-emerald-400 bg-emerald-400/10",
  pending: "text-amber-400 bg-amber-400/10",
  refunded: "text-blue-400 bg-blue-400/10",
  cancelled: "text-text-secondary bg-white/5",
  rejected: "text-rose-400 bg-rose-400/10",
};

const AVATAR_COLORS = [
  "bg-violet-500/20 text-violet-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-amber-500/20 text-amber-300",
  "bg-rose-500/20 text-rose-300",
  "bg-blue-500/20 text-blue-300",
  "bg-pink-500/20 text-pink-300",
];

const avatarColor = (initials: string) =>
  AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];

const PaymentRow: React.FC<{ payment: RecentPayment; index: number }> = ({
  payment,
  index,
}) => (
  <div
    className={`flex items-center gap-3 py-3 ${
      index !== 0 ? "border-t border-border" : ""
    }`}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(payment.initials)}`}
    >
      {payment.initials}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-text-primary truncate">
        {payment.member_name}
      </p>
      <p className="text-xs text-text-secondary truncate">
        {payment.item_name}
      </p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-sm font-bold text-text-primary">
        {formatCurrency(payment.amount)}
      </p>
      <span
        className={`text-xs font-semibold px-1.5 py-0.5 rounded capitalize ${
          PAYMENT_STATUS_STYLES[payment.status] ?? "text-text-secondary"
        }`}
      >
        {payment.status}
      </span>
    </div>
  </div>
);

// ── New member row ────────────────────────────────────────────────────────────

interface NewMember {
  name: string;
  plan_name: string;
  created_at: string;
  initials: string;
  verified: boolean;
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const MemberRow: React.FC<{ member: NewMember; index: number }> = ({
  member,
  index,
}) => (
  <div
    className={`flex items-center gap-3 py-3 ${
      index !== 0 ? "border-t border-border" : ""
    }`}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(member.initials)}`}
    >
      {member.initials}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-text-primary truncate">
        {member.name}
      </p>
      <p className="text-xs text-text-secondary">
        {member.plan_name || "No plan"}
      </p>
    </div>
    <div className="text-right shrink-0">
      <p
        className={`text-xs font-semibold ${
          member.verified ? "text-emerald-400" : "text-amber-400"
        }`}
      >
        {member.verified ? "Verified" : "Unverified"}
      </p>
      <p className="text-xs text-text-secondary mt-0.5">
        {timeAgo(member.created_at)}
      </p>
    </div>
  </div>
);

// ── Plan distribution bar ─────────────────────────────────────────────────────

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

export default function Dashboard() {
  const {
    stats,
    chartData,
    peakHourData,
    isLoading: statsLoading,
    weeklyChartData,
    recentPayments,
    newMembers,
    planStats,
  } = useStats();

  const [attendanceView, setAttendanceView] =
    useState<AttendanceView>("monthly");

  const activeAttendanceData =
    attendanceView === "monthly" ? chartData : weeklyChartData;

  const attendanceLabel =
    attendanceView === "monthly"
      ? "Check-ins over the last 6 months"
      : "Check-ins over the last 7 days";

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* ── Row 1: Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={
            statsLoading ? "—" : (stats?.total_members ?? 0).toLocaleString()
          }
          trend={`+${stats?.new_members_this_month ?? 0} this month`}
          color="indigo"
          loading={statsLoading}
        />
        <StatCard
          title="Active Subscriptions"
          value={
            statsLoading
              ? "—"
              : (stats?.active_subscriptions ?? 0).toLocaleString()
          }
          trend={
            statsLoading
              ? "Loading..."
              : stats?.expiring_soon
                ? `⚠ ${stats.expiring_soon} expiring in 7 days`
                : "All subscriptions healthy"
          }
          color="emerald"
          loading={statsLoading}
        />
        <StatCard
          title="Today's Check-ins"
          value={
            statsLoading ? "—" : (stats?.todays_checkins ?? 0).toLocaleString()
          }
          trend={
            statsLoading
              ? "Loading..."
              : stats?.peak_hour_today !== null &&
                  stats?.peak_hour_today !== undefined
                ? `Peak today: ${formatHour(stats.peak_hour_today)}`
                : "Live gym occupancy"
          }
          color="amber"
          loading={statsLoading}
        />
        <StatCard
          title="Revenue This Month"
          value={
            statsLoading
              ? "—"
              : `₱${(stats?.revenue_this_month ?? 0).toLocaleString()}`
          }
          trend={
            statsLoading
              ? "Loading..."
              : stats?.revenue_growth_percent !== undefined
                ? `${stats.revenue_growth_percent >= 0 ? "+" : ""}${stats.revenue_growth_percent}% vs last month`
                : "Monthly revenue"
          }
          color="rose"
          loading={statsLoading}
        />
      </div>

      {/* ── Row 2: Attendance Chart (with weekly/monthly toggle) ── */}
      <div className="bg-surface p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Attendance</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {attendanceLabel}
            </p>
          </div>
          <ViewToggle value={attendanceView} onChange={setAttendanceView} />
        </div>

        <div style={{ width: "100%", height: 256, minWidth: 0, minHeight: 0 }}>
          {statsLoading && attendanceView === "monthly" ? (
            <ChartSkeleton />
          ) : activeAttendanceData.length === 0 ? (
            <NoDataState message="No attendance data yet" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeAttendanceData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7CFF00" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7CFF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#2A2A2A"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#B3B3B3", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#B3B3B3", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: COLORS.textPrimary }}
                  itemStyle={{ color: COLORS.textSecondary }}
                  cursor={{
                    stroke: "#7CFF00",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  formatter={(value: number | undefined) =>
                    [value ?? 0, "Check-ins"] as const
                  }
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="#7CFF00"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorVisits)"
                  dot={{ fill: "#7CFF00", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#7CFF00" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 3: Revenue Chart + Peak Hours ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue Chart */}
        <div className="bg-surface p-6 border border-border shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-text-primary">
              Monthly Revenue
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Subscription income over the last 6 months
            </p>
          </div>
          <div
            style={{ width: "100%", height: 224, minWidth: 0, minHeight: 0 }}
          >
            {statsLoading ? (
              <ChartSkeleton />
            ) : chartData.length === 0 ? (
              <NoDataState message="No revenue data yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#2A2A2A"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#B3B3B3", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#B3B3B3", fontSize: 12 }}
                    tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: COLORS.textPrimary }}
                    itemStyle={{ color: COLORS.textSecondary }}
                    formatter={(value: number | undefined) =>
                      [formatCurrency(value ?? 0), "Revenue"] as const
                    }
                    cursor={{
                      stroke: "#FBBF24",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FBBF24"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    dot={{ fill: "#FBBF24", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#FBBF24" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-surface p-6 border border-border shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-text-primary">Peak Hours</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Hourly check-in distribution — last 30 days
            </p>
          </div>
          <div
            style={{ width: "100%", height: 224, minWidth: 0, minHeight: 0 }}
          >
            {statsLoading ? (
              <ChartSkeleton />
            ) : peakHourData.length === 0 ? (
              <NoDataState message="No check-in data yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHourData} barSize={14}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#2A2A2A"
                  />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#B3B3B3", fontSize: 11 }}
                    dy={8}
                    interval={1}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#B3B3B3", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: COLORS.textPrimary }}
                    itemStyle={{ color: COLORS.textSecondary }}
                    formatter={(value: number | undefined) =>
                      [value ?? 0, "Check-ins"] as const
                    }
                    cursor={{
                      fill: "rgba(251,191,36,0.08)",
                      color: COLORS.textPrimary,
                    }}
                  />
                  <Bar
                    dataKey="checkins"
                    radius={[4, 4, 0, 0]}
                    // Replaces the <Cell /> mapping by dynamically filling the generated rectangle
                    shape={(props: any) => {
                      const maxCheckins = Math.max(
                        ...peakHourData.map((d) => d.checkins),
                      );
                      const fillColor =
                        props.checkins === maxCheckins ? "#7CFF00" : "#FBBF24";

                      return (
                        <rect
                          x={props.x}
                          y={props.y}
                          width={props.width}
                          height={props.height}
                          rx={4}
                          ry={4}
                          fill={fillColor}
                        />
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Recent Payments + New Members + Plan Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Payments */}
        <div className="bg-surface p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Recent Payments
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Latest transactions
              </p>
            </div>
            <span className="text-xs text-text-secondary bg-white/5 px-2 py-1 rounded-md">
              Today
            </span>
          </div>
          <div className="">
            {recentPayments.map((payment, i) => (
              <PaymentRow key={i} payment={payment} index={i} />
            ))}
          </div>
        </div>

        {/* New Members */}
        <div className="bg-surface p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-text-primary">
                New Members
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Recently joined
              </p>
            </div>
            <span className="text-xs text-text-secondary bg-white/5 px-2 py-1 rounded-md">
              {stats?.new_members_this_month ?? "—"} this month
            </span>
          </div>
          <div className="">
            {newMembers.map((member, i) => (
              <MemberRow key={i} member={member} index={i} />
            ))}
          </div>
        </div>

        {/* Subscriptions by Plan */}
        <div className="bg-surface p-6 border border-border shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-text-primary">
              Subscriptions by Plan
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Active subscriber breakdown
            </p>
          </div>

          {/* Total badge */}
          <div className="mb-5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-text-primary">
              {planStats.reduce((s, p) => s + p.count, 0).toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary">total active</span>
          </div>

          {/* Plan bars */}
          <div className="space-y-4">
            {planStats.map((plan, i) => (
              <PlanBar
                key={plan.plan_name}
                plan={plan}
                index={i}
                total={planStats.reduce((s, p) => s + p.count, 0)}
              />
            ))}
          </div>

          {/* Color legend dots */}
          <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-x-4 gap-y-2">
            {planStats.map((plan, i) => (
              <span
                key={plan.plan_name}
                className="flex items-center gap-1.5 text-xs text-text-secondary"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length],
                  }}
                />
                {plan.plan_name.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 5: Quick Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricTile
          label="Avg. Session Duration"
          value={
            statsLoading
              ? "—"
              : stats?.avg_daily_duration_minutes
                ? `${stats.avg_daily_duration_minutes} min`
                : "No data"
          }
          icon="⏱"
          loading={statsLoading}
        />
        <MetricTile
          label="Expiring Subscriptions"
          value={statsLoading ? "—" : `${stats?.expiring_soon ?? 0} in 7 days`}
          icon="⚠️"
          loading={statsLoading}
          alert={(stats?.expiring_soon ?? 0) > 0}
        />
        <MetricTile
          label="Revenue Growth"
          value={
            statsLoading
              ? "—"
              : stats?.revenue_growth_percent !== undefined
                ? `${stats.revenue_growth_percent >= 0 ? "+" : ""}${stats.revenue_growth_percent}%`
                : "N/A"
          }
          icon="📈"
          loading={statsLoading}
          positive={stats ? stats.revenue_growth_percent >= 0 : undefined}
        />
      </div>
    </div>
  );
}
