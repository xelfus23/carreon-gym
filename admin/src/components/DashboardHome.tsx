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
import { STATS, REVENUE_DATA } from "../constants";
import { chatService } from "../services/AIService";

const DashboardHome: React.FC = () => {
    const [aiAnalysis, setAiAnalysis] = useState<string>(
        "Initializing analysis session...",
    );
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const session = await chatService.createChat();
                const statsStr = `Members: ${STATS.totalMembers}, Revenue: $${STATS.activeRevenue}, Occupancy: ${STATS.occupancyRate}%`;
                const prompt = `You are a gym business consultant. Analyze these stats: ${statsStr}. Identify one major growth opportunity and one risk. Response should be concise bullet points.`;

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
                    "Analytics engine unavailable. Please check your backend at 192.168.1.150:6000.",
                );
            } finally {
                setIsTyping(false);
            }
        };
        fetchAnalysis();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Members"
                    value={STATS.totalMembers.toLocaleString()}
                    trend="+12% from last month"
                    color="indigo"
                />
                <StatCard
                    title="Monthly Revenue"
                    value={`$${(STATS.activeRevenue / 1000).toFixed(1)}k`}
                    trend="+5.4% vs prev month"
                    color="emerald"
                />
                <StatCard
                    title="Gym Occupancy"
                    value={`${STATS.occupancyRate}%`}
                    trend="Peak at 6:00 PM"
                    color="amber"
                />
                <StatCard
                    title="Avg Rating"
                    value={STATS.trainerSatisfaction.toString()}
                    trend="Based on 450 reviews"
                    color="rose"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">
                            Revenue Performance
                        </h3>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-1 outline-none">
                            <option>Last 6 Months</option>
                            <option>Year to Date</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={REVENUE_DATA}>
                                <defs>
                                    <linearGradient
                                        id="colorRev"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#6366f1"
                                            stopOpacity={0.1}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#6366f1"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f1f5f9"
                                />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "none",
                                        boxShadow:
                                            "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                    }}
                                    cursor={{
                                        stroke: "#6366f1",
                                        strokeWidth: 2,
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl">✨</span>
                        <h3 className="text-lg font-bold">
                            AI Business Insight
                        </h3>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-line bg-slate-800/50 p-4 rounded-xl border border-slate-700 min-h-[150px]">
                            {aiAnalysis}
                            {isTyping && (
                                <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse"></span>
                            )}
                        </div>
                    </div>
                    <button className="mt-6 w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                        Generate Report
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{
    title: string;
    value: string;
    trend: string;
    color: string;
}> = ({ title, value, trend, color }) => {
    const colorMap: Record<string, string> = {
        indigo: "bg-indigo-50 text-indigo-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        rose: "bg-rose-50 text-rose-600",
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{value}</h2>
            <p
                className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${colorMap[color]}`}
            >
                {trend}
            </p>
        </div>
    );
};

export default DashboardHome;
