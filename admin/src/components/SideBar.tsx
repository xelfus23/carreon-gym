import React, { useState } from "react";
import { NavItem } from "../types";
import {
  ChartColumnBig,
  Dumbbell,
  HandCoins,
  Logs,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Settings,
  ShoppingBasket,
  // Sparkles,
  Ticket,
  UserRoundKey,
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
      id: NavItem.ANALYTICS,
      label: "Analytics",
      icon: <ChartColumnBig className="h-4 stroke-2" />,
      dividerBefore: true,
    },
    {
      id: NavItem.QR_CODE,
      label: "QR Codes",
      icon: <QrCode className="h-4 stroke-2" />,
    },
    {
      id: NavItem.ATTENDANCE_LOG,
      label: "Attendance Log",
      icon: <Logs className="h-4 stroke-2" />,
    },
    {
      id: NavItem.TRANSACTIONS,
      label: "Transactions",
      icon: <HandCoins className="h-4 stroke-2" />,
    },
    {
      id: NavItem.ADMIN,
      label: "Admin",
      icon: <UserRoundKey className="h-4 stroke-2" />,
      dividerBefore: true,
    },
    {
      id: NavItem.MEMBERS,
      label: "Members",
      icon: <UsersRound className="h-4 stroke-2" />,
    },
    {
      id: NavItem.GYM_PRODUCTS,
      label: "Products",
      icon: <ShoppingBasket className="h-4 stroke-2" />,
      dividerBefore: true,
    },
    {
      id: NavItem.SUBSCRIPTIONS,
      label: "Gym Subscriptions",
      icon: <Ticket className="h-4 stroke-2" />,
    },

    // {
    //   id: NavItem.AI_INSIGHTS,
    //   label: "AI Insights",
    //   icon: <Sparkles className="h-4 stroke-2" />,
    // },
    {
      id: NavItem.GYM_EQUIPMENTS,
      label: "Gym Equipments",
      icon: <Dumbbell className="h-4 stroke-2" />,
      dividerBefore: true,
    },
    {
      id: NavItem.GYM_SETTINGS,
      label: "Gym Settings",
      icon: <Settings className="h-4 stroke-2" />,
    },
  ];

  return (
    <aside
      className={`${sideBarOn ? "w-[15vw]" : "w-[5vw]"} transition-all bg-surface h-screen flex flex-col text-text-secondary`}
    >
      <div
        className={`p-4 flex ${sideBarOn ? "justify-between" : "justify-center"}`}
      >
        {sideBarOn && (
          <img
            // src="/careon/brand-logo.png"
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

      <nav className="flex-1 p-4 mt-4 space-y-1">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.dividerBefore && <div className="h-px bg-border mb-1" />}
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center ${sideBarOn ? "justify-normal aspect-auto rounded-none p-3" : "rounded-lg aspect-square justify-center h-10"} gap-3 transition-all duration-200 ${
                currentTab === item.id
                  ? "text-primary"
                  : " hover:text-text-primary"
              }`}
            >
              {item.icon}
              {sideBarOn && <span className={`text-sm`}>{item.label}</span>}
            </button>
          </div>
        ))}
      </nav>

      {sideBarOn && (
        <div className="p-6">
          <div className="bg-background p-4 border border-border rounded-lg">
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
