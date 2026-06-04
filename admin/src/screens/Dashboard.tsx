// import React, { useEffect, useState } from "react";
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
} from "recharts";
// import { chatService } from "../services/ai.service";
import { useStats } from "../hooks/useStats";

export default function Dashboard() {
  const {
    stats,
    chartData,
    peakHourData,
    isLoading: statsLoading,
  } = useStats();

  // const [aiAnalysis, setAiAnalysis] = useState<string>(
  //   "Initializing analysis session...",
  // );
  // const [isTyping, setIsTyping] = useState(false);

  // useEffect(() => {
  //   if (statsLoading || !stats) return;

  //   const fetchAnalysis = async () => {
  //     try {
  //       const session = await chatService.createChat();

  //       const statsStr = [
  //         `Total members: ${stats.total_members}`,
  //         `New members this month: ${stats.new_members_this_month}`,
  //         `Active subscriptions: ${stats.active_subscriptions}`,
  //         `Today's check-ins: ${stats.todays_checkins}`,
  //         `Revenue this month: ₱${stats.revenue_this_month}`,
  //         `Revenue growth: ${stats.revenue_growth_percent}%`,
  //         `Subscriptions expiring soon: ${stats.expiring_soon}`,
  //         `Peak hour today: ${stats.peak_hour_today !== null ? formatHour(stats.peak_hour_today) : "N/A"}`,
  //       ].join(", ");

  //       const prompt =
  //         `You are a gym business consultant. Analyze these gym stats: ${statsStr}. ` +
  //         `Identify one major growth opportunity and one risk. ` +
  //         `Response should be concise bullet points, max 4 bullets total.`;

  //       setIsTyping(true);
  //       setAiAnalysis("");

  //       await chatService.sendMessage(
  //         session.id,
  //         prompt,
  //         (token) => setAiAnalysis((prev) => prev + token),
  //         () => {},
  //       );
  //     } catch (error) {
  //       console.error("Dashboard Analysis Error:", error);
  //       setAiAnalysis(
  //         "Analytics engine unavailable. Please check your backend connection.",
  //       );
  //     } finally {
  //       setIsTyping(false);
  //     }
  //   };

  //   fetchAnalysis();
  // }, [stats, statsLoading]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Row 1: Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* ── Row 2: Attendance Chart + AI Insight ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Chart */}
        <div className="lg:col-span-2 bg-surface p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                Monthly Attendance
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Check-ins over the last 6 months
              </p>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: 256,
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {statsLoading ? (
              <ChartSkeleton />
            ) : chartData.length === 0 ? (
              <NoDataState message="No attendance data yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorVisits"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#7CFF00"
                        stopOpacity={0.15}
                      />
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
                    labelStyle={{ color: "#B3B3B3" }}
                    cursor={{
                      stroke: "#7CFF00",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#7CFF00"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                    dot={{
                      fill: "#7CFF00",
                      r: 3,
                      strokeWidth: 0,
                    }}
                    activeDot={{ r: 5, fill: "#7CFF00" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AI Insight Panel */}
        {/* <div className="bg-surface border border-border text-text-primary p-6 shadow-xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="text-base font-bold leading-tight">
                AI Business Insight
              </h3>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Powered by your live stats
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="text-text-secondary leading-relaxed text-sm whitespace-pre-line bg-background p-4 border border-border min-h-37.5">
              {statsLoading ? (
                <span className="text-text-secondary text-xs animate-pulse">
                  Waiting for stats to load…
                </span>
              ) : (
                <>
                  {aiAnalysis}
                  {isTyping && (
                    <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse align-middle" />
                  )}
                </>
              )}
            </div>
          </div>

          <button className="mt-6 w-full py-3 bg-primary text-background font-bold hover:bg-primary-dark transition-colors">
            Generate Report
          </button>
        </div> */}
      </div>

      {/* ── Row 3: Revenue Chart + Peak Hours ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            style={{
              width: "100%",
              height: 224,
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {" "}
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
                    labelStyle={{ color: "#B3B3B3" }}
                    formatter={(value: number | undefined) => [
                      `₱${value?.toLocaleString()}`,
                      "Revenue",
                    ]}
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
                    dot={{
                      fill: "#FBBF24",
                      r: 3,
                      strokeWidth: 0,
                    }}
                    activeDot={{ r: 5, fill: "#FBBF24" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Peak Hours Chart */}
        <div className="bg-surface p-6 border border-border shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-text-primary">Peak Hours</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Hourly check-in distribution — last 30 days
            </p>
          </div>

          <div
            style={{
              width: "100%",
              height: 224,
              minWidth: 0,
              minHeight: 0,
            }}
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
                    labelStyle={{ color: "#B3B3B3" }}
                    formatter={(value: number | undefined) => [
                      value,
                      "Check-ins",
                    ]}
                    cursor={{
                      fill: "rgba(251,191,36,0.08)",
                    }}
                  />
                  <Bar
                    dataKey="checkins"
                    fill="#FBBF24"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Quick Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatHour = (h: number): string => {
  if (h === 0) return "12AM";
  if (h < 12) return `${h}AM`;
  if (h === 12) return "12PM";
  return `${h - 12}PM`;
};

const tooltipStyle: React.CSSProperties = {
  borderRadius: "12px",
  border: "1px solid #2A2A2A",
  backgroundColor: "#1A1A1A",
  color: "#FFFFFF",
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.4)",
};

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

// ── StatCard ──────────────────────────────────────────────────────────────────

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

// ── MetricTile ────────────────────────────────────────────────────────────────

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
