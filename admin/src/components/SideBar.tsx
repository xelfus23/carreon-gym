import React from "react";
import { NavItem } from "../types";
import {
    BicepsFlexed,
    CalendarDays,
    ChartColumnBig,
    QrCode,
    Settings,
    Sparkles,
    UsersRound,
} from "lucide-react";

interface SidebarProps {
    currentTab: NavItem;
    setTab: (tab: NavItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab }) => {
    const menuItems = [
        {
            id: NavItem.DASHBOARD,
            label: "Dashboard",
            icon: <ChartColumnBig />,
        },
        {
            id: NavItem.QRCODE,
            label: "QR",
            icon: <QrCode />,
        },
        {
            id: NavItem.MEMBERS,

            label: "Members",

            icon: <UsersRound />,
        },
        {
            id: NavItem.TRAINERS,

            label: "Trainers",

            icon: <BicepsFlexed />,
        },
        {
            id: NavItem.CLASSES,

            label: "Classes",

            icon: <CalendarDays />,
        },
        {
            id: NavItem.AI_INSIGHTS,

            label: "AI Insights",

            icon: <Sparkles />,
        },
        {
            id: NavItem.SETTINGS,

            label: "Settings",

            icon: <Settings />,
        },
    ];

    return (
        <aside className="w-64 bg-surface h-screen flex flex-col text-text-secondary">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-dark rounded-lg flex items-center justify-center text-white font-bold">
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
                                ? "bg-primary-dark text-text-primary shadow-lg shadow-indigo-500/20"
                                : "hover:bg-primary-dark/20 hover:text-text-primary"
                        }`}
                    >
                        {item.icon}
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
