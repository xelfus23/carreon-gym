import React, { useEffect, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { chatService } from "../services/AIService";
// import { useMember } from "../hooks/useMember";
import { useStats } from "../hooks/useStats";

const DashboardHome: React.FC = () => {
    // const { members } = useMember();
    const { stats, chartData, isLoading: statsLoading } = useStats();

    const [aiAnalysis, setAiAnalysis] = useState<string>(
        "Initializing analysis session...",
    );
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // Don't run until we have real stats loaded
        if (statsLoading || !stats) return;

        const fetchAnalysis = async () => {
            try {
                const session = await chatService.createChat();

                const statsStr = [
                    `Total members: ${stats.total_members}`,
                    `New members this month: ${stats.new_members_this_month}`,
                    `Active subscriptions: ${stats.active_subscriptions}`,
                    `Today's check-ins: ${stats.todays_checkins}`,
                ].join(", ");

                const prompt =
                    `You are a gym business consultant. Analyze these gym stats: ${statsStr}. ` +
                    `Identify one major growth opportunity and one risk. ` +
                    `Response should be concise bullet points, max 4 bullets total.`;

                setIsTyping(true);
                setAiAnalysis("");

                await chatService.sendMessage(
                    session.id,
                    prompt,
                    (token) => setAiAnalysis((prev) => prev + token),
                    () => {},
                );
            } catch (error) {
                console.error("Dashboard Analysis Error:", error);
                setAiAnalysis(
                    "Analytics engine unavailable. Please check your backend connection.",
                );
            } finally {
                setIsTyping(false);
            }
        };

        fetchAnalysis();
    }, [stats, statsLoading]); // Re-runs when stats load

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Members"
                    value={
                        statsLoading
                            ? "—"
                            : (stats?.total_members ?? 0).toLocaleString()
                    }
                    trend={
                        statsLoading
                            ? "Loading..."
                            : `+${stats?.new_members_this_month ?? 0} this month`
                    }
                    color="indigo"
                    loading={statsLoading}
                />
                <StatCard
                    title="Active Subscriptions"
                    value={
                        statsLoading
                            ? "—"
                            : (
                                  stats?.active_subscriptions ?? 0
                              ).toLocaleString()
                    }
                    trend="Currently active plans"
                    color="emerald"
                    loading={statsLoading}
                />
                <StatCard
                    title="Today's Check-ins"
                    value={
                        statsLoading
                            ? "—"
                            : (stats?.todays_checkins ?? 0).toLocaleString()
                    }
                    trend="Live gym occupancy"
                    color="amber"
                    loading={statsLoading}
                />
                <StatCard
                    title="New This Month"
                    value={
                        statsLoading
                            ? "—"
                            : (
                                  stats?.new_members_this_month ?? 0
                              ).toLocaleString()
                    }
                    trend="Member growth"
                    color="rose"
                    loading={statsLoading}
                />
            </div>

            {/* ── Chart + AI ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance Chart */}
                <div className="lg:col-span-2 bg-surface p-6 rounded-3xl border border-border shadow-sm">
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

                    <div className="h-75 w-full">
                        {statsLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
                            </div>
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
                                            <stop
                                                offset="95%"
                                                stopColor="#7CFF00"
                                                stopOpacity={0}
                                            />
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
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "1px solid #2A2A2A",
                                            backgroundColor: "#1A1A1A",
                                            color: "#FFFFFF",
                                            boxShadow:
                                                "0 10px 15px -3px rgb(0 0 0 / 0.4)",
                                        }}
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
                <div className="bg-surface border border-border text-text-primary p-6 rounded-3xl shadow-xl flex flex-col">
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
                        <div className="text-text-secondary leading-relaxed text-sm whitespace-pre-line bg-background p-4 rounded-xl border border-border min-h-[150px]">
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

                    <button className="mt-6 w-full py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary-dark transition-colors">
                        Generate Report
                    </button>
                </div>
            </div>
        </div>
    );
};

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
        <div className="bg-surface p-6 rounded-3xl border border-border shadow-sm">
            <p className="text-sm font-medium text-text-secondary mb-1">
                {title}
            </p>
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

export default DashboardHome;
