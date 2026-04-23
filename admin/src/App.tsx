import React, { useState } from "react";
import Login from "./components/Login";
import { useAuthContext } from "./hooks/contextHooks";
import DashboardHome from "./screens/DashboardHome";
import AssistantTab from "./screens/AssistantTab";
import { NavItem } from "./types";
import Sidebar from "./components/SideBar";
import QRTab from "./screens/QRTab";
import MemberManagement from "./screens/MemberManagement";
import EquipmentTab from "./screens/EquipmentTab";
import AttendanceLog from "./screens/AttendanceLog";
import Product from "./screens/Product";
import AdminManagement from "./screens/AdminManagement";
import Transactions from "./screens/Transactions";
import GymSettings from "./screens/GymSettings";
import GymSubscriptions from "./screens/GymSubscriptions";

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItem>(NavItem.ANALYTICS);
  const { isAuthenticated, isInitializing, user, logout } = useAuthContext();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-dark border-t-primary rounded-full animate-spin"></div>
          <p className="text-text-primary text-xs font-bold uppercase tracking-widest">
            Carreon Gym Initializing
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
      case NavItem.ANALYTICS:
        return <DashboardHome />;
      case NavItem.ADMIN:
        return <AdminManagement />;
      case NavItem.MEMBERS:
        return <MemberManagement />;
      case NavItem.TRANSACTIONS:
        return <Transactions />;
      case NavItem.ATTENDANCE_LOG:
        return <AttendanceLog />;
      case NavItem.GYM_EQUIPMENTS:
        return <EquipmentTab />;
      case NavItem.GYM_PRODUCTS:
        return <Product />;
      case NavItem.AI_INSIGHTS:
        return <AssistantTab />;
      case NavItem.SUBSCRIPTIONS:
        return <GymSubscriptions />
      case NavItem.QR_CODE:
        return <QRTab />;
      case NavItem.GYM_SETTINGS:
        return <GymSettings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary space-y-4">
            <div className="text-6xl">🚧</div>
            <h2 className="text-2xl font-bold">Module Under Construction</h2>
            <p>We're polishing this feature to perfection. Check back soon!</p>
            <button
              onClick={() => setCurrentTab(NavItem.ANALYTICS)}
              className="px-6 py-2 bg-primary-dark text-text-primary rounded-xl hover:bg-primary hover:text-background font-bold transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentTab={currentTab} setTab={setCurrentTab} />

      <main className="flex-1 bg-background relative">
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
            {/* <button className="relative p-2 text-text-primary hover:text-text-secondary hover:bg-border rounded-full transition-all">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-border rounded-full"></span>
            </button> */}
            <div className="flex items-center gap-3 pl-6 border-l border-border group">
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
                className="w-10 h-10 rounded-full border-2 border-border object-cover"
                alt="Profile"
              />
            </div>
          </div>
        </header>

        <div className="p-10 mx-auto h-[calc(100vh-80px)] overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
