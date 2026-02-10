import React from "react";
import { NavItem } from "../types";

interface SidebarProps {
    currentTab: NavItem;
    setTab: (tab: NavItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab }) => {
    const menuItems = [
        { id: NavItem.DASHBOARD, label: "Dashboard", icon: "📊" },
        { id: NavItem.MEMBERS, label: "Members", icon: "👥" },
        { id: NavItem.TRAINERS, label: "Trainers", icon: "💪" },
        { id: NavItem.CLASSES, label: "Classes", icon: "🗓️" },
        { id: NavItem.AI_INSIGHTS, label: "AI Insights", icon: "✨" },
        { id: NavItem.SETTINGS, label: "Settings", icon: "⚙️" },
    ];

    return (
        <aside className="w-64 bg-slate-900 h-screen flex flex-col text-slate-300">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
                    C
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                    Careon Gym
                </h1>
            </div>

            <nav className="flex-1 px-4 mt-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            currentTab === item.id
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                : "hover:bg-slate-800 hover:text-white"
                        }`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-6">
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">
                        System Status
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm text-slate-300">
                            Live Services Active
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
