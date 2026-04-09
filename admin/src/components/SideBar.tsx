import React, { useState } from "react";
import { NavItem } from "../types";
import {
    ChartColumnBig,
    Dumbbell,
    PanelLeftClose,
    PanelLeftOpen,
    QrCode,
    Sparkles,
    UsersRound,
} from "lucide-react";

interface SidebarProps {
    currentTab: NavItem;
    setTab: (tab: NavItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab }) => {
    const [sideBarOn, setSideBarOn] = useState<boolean>(true);

    const menuItems = [
        {
            id: NavItem.DASHBOARD,
            label: "Dashboard",
            icon: <ChartColumnBig className="h-5 stroke-2" />,
        },
        {
            id: NavItem.QR_CODE,
            label: "QR",
            icon: <QrCode className="h-5 stroke-2" />,
        },
        {
            id: NavItem.MEMBERS,
            label: "Members",
            icon: <UsersRound className="h-5 stroke-2" />,
        },
        {
            id: NavItem.GYM_EQUIPMENTS,
            label: "Gym Equipments",
            icon: <Dumbbell />,
        },
        {
            id: NavItem.AI_INSIGHTS,
            label: "AI Insights",
            icon: <Sparkles className="h-5 stroke-2" />,
        },
    ];

    return (
        <aside
            className={`${sideBarOn ? "w-64" : "w-20"} transition-all bg-surface h-screen flex flex-col text-text-secondary`}
        >
            <div
                className={`p-4 flex ${sideBarOn ? "justify-between" : "justify-center"}`}
            >
                {sideBarOn && (
                    <img
                        src="/careon/brand-logo.png"
                        className="object-contain self-start h-10 transition-all"
                    />
                )}
                {sideBarOn ? (
                    <PanelLeftClose
                        onClick={() => setSideBarOn(false)}
                        className="aspect-square h-10 transition-all"
                    />
                ) : (
                    <PanelLeftOpen
                        onClick={() => setSideBarOn(true)}
                        className="aspect-square h-10 transition-all"
                    />
                )}
            </div>

            <nav className="flex-1 px-4 mt-4 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        className={`w-full h-10 flex items-center ${sideBarOn ? "justify-normal aspect-auto" : "aspect-square justify-center"} gap-3 px-4 py-3 transition-all duration-200 ${
                            currentTab === item.id
                                ? "bg-primary-dark text-text-primary shadow-lg shadow-primary/20"
                                : "hover:bg-primary-dark/20 hover:text-text-primary"
                        }`}
                    >
                        <p className="">{item.icon}</p>
                        {sideBarOn && <span className={``}>{item.label}</span>}
                    </button>
                ))}
            </nav>

            {sideBarOn && (
                <div className="p-6">
                    <div className="bg-background p-4 border border-border">
                        <p className="text-xs uppercase tracking-wider text-text-secondary font-bold mb-2">
                            System Status
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                            <span className="text-sm text-text-primary">
                                Live Services Active
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
