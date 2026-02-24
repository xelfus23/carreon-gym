import React, { useState } from "react";
import Login from "./components/Login";
import { useAuth } from "./contexts/useAuth";
import DashboardHome from "./components/DashboardHome";
import MemberManagement from "./components/MemberManagement";
import AssistantTab from "./components/AssistantTab";
import { NavItem } from "./types";
import Sidebar from "./components/SideBar";
import Attendance from "./components/Attendance";

const App: React.FC = () => {
    const [currentTab, setCurrentTab] = useState<NavItem>(NavItem.DASHBOARD);
    const { isAuthenticated, isLoading, user, logout } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-dark border-t-surface rounded-full animate-spin"></div>
                    <p className="text-text-primary text-xs font-bold uppercase tracking-widest">
                        Careon Gym Initializing
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login />;
    }

    const renderContent = () => {
        switch (currentTab) {
            case NavItem.DASHBOARD:
                return <DashboardHome />;
            case NavItem.MEMBERS:
                return <MemberManagement />;
            case NavItem.AI_INSIGHTS:
                return <AssistantTab />;
            case NavItem.QRCODE:
                return <Attendance />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary space-y-4">
                        <div className="text-6xl">🚧</div>
                        <h2 className="text-2xl font-bold">
                            Module Under Construction
                        </h2>
                        <p>
                            We're polishing this feature to perfection. Check
                            back soon!
                        </p>
                        <button
                            onClick={() => setCurrentTab(NavItem.DASHBOARD)}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar currentTab={currentTab} setTab={setCurrentTab} />

            <main className="flex-1 overflow-y-auto bg-background relative">
                <header className="sticky top-0 z-10 bg-surface backdrop-blur-md border-b border-border px-10 py-4 flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-text-primary capitalize">
                            {currentTab.toLowerCase().replace("_", " ")}
                        </h2>
                        <p className="text-xs text-text-secondary">
                            Welcome back, {user?.firstName || "Administrator"}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-text-primary hover:text-text-secondary hover:bg-border rounded-full transition-all">
                            <span className="text-xl">🔔</span>
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-border rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-200 group">
                            <div className="text-right">
                                <p className="text-sm font-bold text-text-primary">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <button
                                    onClick={() => logout()}
                                    className="text-[10px] text-danger uppercase tracking-tighter font-black hover:underline cursor-pointer"
                                >
                                    Logout
                                </button>
                            </div>
                            <img
                                src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=5ECC0080&color=FFFFFF`}
                                className="w-10 h-10 rounded-full border-2 border-slate-100 object-cover"
                                alt="Profile"
                            />
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-400 mx-auto min-h-[calc(100vh-80px)]">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default App;
