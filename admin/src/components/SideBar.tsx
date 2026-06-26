import React, { useEffect, useState } from "react";
import { NavItem } from "../types";
import {
    CircleStar,
    DoorOpen,
    Dumbbell,
    LayoutDashboard,
    Package,
    PanelLeftClose,
    PanelLeftOpen,
    QrCode,
    ReceiptText,
    Settings,
    UsersRound,
    Wifi,
    WifiOff,
    Clock,
} from "lucide-react";

interface SidebarProps {
    currentTab: NavItem;
    setTab: (tab: NavItem) => void;
}

// ── Navigation Configuration ──────────────────────────────────────────────────

const NAV_CATEGORIES = [
    {
        title: "Overview",
        items: [
            {
                id: NavItem.ANALYTICS,
                label: "Analytics",
                icon: <LayoutDashboard className="h-4 w-4 stroke-2" />,
            },
            {
                id: NavItem.QR_CODE,
                label: "QR Codes",
                icon: <QrCode className="h-4 w-4 stroke-2" />,
            },
        ],
    },
    {
        title: "Management",
        items: [
            {
                id: NavItem.MEMBERS,
                label: "Members",
                icon: <UsersRound className="h-4 w-4 stroke-2" />,
            },
            {
                id: NavItem.TRANSACTIONS,
                label: "Payments",
                icon: <ReceiptText className="h-4 w-4 stroke-2" />,
            },
            {
                id: NavItem.ATTENDANCE_LOG,
                label: "Attendance",
                icon: <DoorOpen className="h-4 w-4 stroke-2" />,
            },
            {
                id: NavItem.GYM_PRODUCTS,
                label: "Inventory",
                icon: <Package className="h-4 w-4 stroke-2" />,
            },
            {
                id: NavItem.SUBSCRIPTIONS,
                label: "Plans",
                icon: <CircleStar className="h-4 w-4 stroke-2" />,
            },
            {
                id: NavItem.GYM_EQUIPMENTS,
                label: "Equipment",
                icon: <Dumbbell className="h-4 w-4 stroke-2" />,
            },
        ],
    },
    {
        title: "Systems",
        items: [
            {
                id: NavItem.GYM_SETTINGS,
                label: "Settings",
                icon: <Settings className="h-4 w-4 stroke-2" />,
            },
        ],
    },
];

// ── Gym open hours (adjust to match gym_details) ──────────────────────────────
const GYM_OPEN_HOUR = 5; // 5:00 AM
const GYM_CLOSE_HOUR = 23; // 11:00 PM

// ── System Status Footer ──────────────────────────────────────────────────────

const SystemStatus: React.FC<{ expanded: boolean }> = ({ expanded }) => {
    const [now, setNow] = useState(new Date());
    const [wsStatus, setWsStatus] = useState<"connecting" | "live" | "offline">(
        "connecting",
    );

    // Live clock — ticks every second
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // Mirror the WS connection the attendance hook already opens so we can
    // show its status without opening a second socket.
    useEffect(() => {
        const BASE_URL = import.meta.env.VITE_SERVER_URL ?? "";
        const wsUrl = BASE_URL.replace(/^http/, "ws") + "/ws/admin";

        let ws: WebSocket;
        let retryTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            setWsStatus("connecting");
            ws = new WebSocket(wsUrl);

            ws.onopen = () => setWsStatus("live");
            ws.onclose = () => {
                setWsStatus("offline");
                // retry after 5 s
                retryTimeout = setTimeout(connect, 5000);
            };
            ws.onerror = () => {
                setWsStatus("offline");
            };
        };

        connect();

        return () => {
            clearTimeout(retryTimeout);
            ws?.close();
        };
    }, []);

    const hour = now.getHours();
    const isOpen = hour >= GYM_OPEN_HOUR && hour < GYM_CLOSE_HOUR;

    const timeString = now.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    const WS_CONFIG = {
        live: {
            dot: "bg-primary animate-pulse",
            label: "Live",
            labelColor: "text-primary",
            icon: <Wifi size={11} className="text-primary" />,
        },
        connecting: {
            dot: "bg-amber-400 animate-pulse",
            label: "Connecting…",
            labelColor: "text-amber-400",
            icon: <Wifi size={11} className="text-amber-400" />,
        },
        offline: {
            dot: "bg-rose-500",
            label: "Offline",
            labelColor: "text-rose-400",
            icon: <WifiOff size={11} className="text-rose-400" />,
        },
    } as const;

    const ws = WS_CONFIG[wsStatus];

    // ── Collapsed: single animated dot ───────────────────────────────────────
    if (!expanded) {
        return (
            <div className="py-1.5 flex justify-center">
                <div
                    className={`h-2 aspect-square rounded-full ${ws.dot}`}
                    title={`WebSocket: ${ws.label}`}
                />
            </div>
        );
    }

    // ── Expanded ─────────────────────────────────────────────────────────────
    return (
        <div className="border-border space-y-3 rounded-lg">
            {/* Header row */}
            <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary/50">
                System Status
            </p>

            {/* WebSocket row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-text-secondary">
                    {ws.icon}
                    <span className="text-xs">WebSocket</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${ws.dot}`} />
                    <span className={`text-xs font-semibold ${ws.labelColor}`}>
                        {ws.label}
                    </span>
                </div>
            </div>

            {/* Gym open/closed row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-text-secondary">
                    <DoorOpen size={11} />
                    <span className="text-xs">Gym</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div
                        className={`w-1.5 h-1.5 rounded-full ${
                            isOpen ? "bg-primary" : "bg-text-secondary/40"
                        }`}
                    />
                    <span
                        className={`text-xs font-semibold ${
                            isOpen ? "text-primary" : "text-text-secondary"
                        }`}
                    >
                        {isOpen ? "Open" : "Closed"}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Live clock */}
            <div className="flex items-center gap-1.5 text-text-secondary">
                <Clock size={11} />
                <span className="text-xs font-mono text-text-primary tabular-nums">
                    {timeString}
                </span>
            </div>
        </div>
    );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab }) => {
    const [sideBarOn, setSideBarOn] = useState(true);

    return (
        <aside
            className={`${
                sideBarOn ? "w-52" : "w-13"
            } shrink-0 transition-all duration-300 bg-surface h-screen flex flex-col text-text-secondary border-r border-border`}
        >
            {/* Header */}
            <div
                className={`p-4 flex items-center ${sideBarOn ? "justify-between" : "justify-center"}`}
            >
                {sideBarOn && (
                    <img
                    // src="/careon/brand-logo.png"
                    // className="object-contain self-start h-8 transition-all"
                    // alt="Logo"
                    />
                )}
                <button
                    onClick={() => setSideBarOn(!sideBarOn)}
                    className="text-text-secondary hover:text-text-primary transition-colors"
                >
                    {sideBarOn ? (
                        <PanelLeftClose className="h-4 w-4" />
                    ) : (
                        <PanelLeftOpen className="h-4 w-4" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 mt-4 space-y-6 overflow-y-auto no-scrollbar">
                {NAV_CATEGORIES.map((category) => (
                    <div key={category.title} className="space-y-1">
                        <div className="h-px bg-linear-to-r from-border to-transparent mb-4" />

                        <h1
                            className={`uppercase text-text-secondary/50 font-mulish text-[10px] font-bold tracking-wider px-4 mb-2 transition-all duration-300 ${
                                sideBarOn
                                    ? "opacity-100 max-h-4"
                                    : "opacity-0 max-h-0 overflow-hidden pointer-events-none"
                            }`}
                        >
                            {category.title}
                        </h1>

                        {category.items.map((item) => {
                            const isActive = currentTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setTab(item.id)}
                                    className={`w-full h-10 flex items-center border-l-2 transition-all duration-200 gap-3 px-4 group ${
                                        isActive
                                            ? "text-primary border-primary bg-linear-to-r from-primary/6 to-transparent translate-x-0"
                                            : `text-text-secondary border-transparent hover:bg-linear-to-r from-text-primary/6 to-transparent hover:text-text-primary ${sideBarOn ? "-translate-x-2" : ""}`
                                    }`}
                                >
                                    <div
                                        className={`${sideBarOn ? "ml-2" : "ml-0"} w-4 h-4 flex items-center justify-center shrink-0 transition-transform`}
                                    >
                                        {item.icon}
                                    </div>
                                    <span
                                        className={`text-sm whitespace-nowrap transition-all duration-300 block overflow-hidden ${
                                            sideBarOn
                                                ? "opacity-100 max-w-37.5 translate-x-0"
                                                : "opacity-0 max-w-0 -translate-x-2 pointer-events-none"
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer — System Status */}
            <div className="p-4">
                <SystemStatus expanded={sideBarOn} />
            </div>
        </aside>
    );
};

export default Sidebar;
