import React, { useState } from "react";
import { NavItem } from "../types";
import {
  Badge,
  CircleSlash,
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
} from "lucide-react";

interface SidebarProps {
  currentTab: NavItem;
  setTab: (tab: NavItem) => void;
}

const overview_items = [
  {
    id: NavItem.ANALYTICS,
    label: "Analytics",
    icon: <LayoutDashboard className="h-4 stroke-2" />,
  },
  {
    id: NavItem.QR_CODE,
    label: "QR Codes",
    icon: <QrCode className="h-4 stroke-2" />,
  },
];

const management_items = [
  {
    id: NavItem.MEMBERS,
    label: "Members",
    icon: <UsersRound className="h-4 stroke-2" />,
  },
  {
    id: NavItem.TRANSACTIONS,
    label: "Payments",
    icon: <ReceiptText className="h-4 stroke-2" />,
  },
  {
    id: NavItem.ATTENDANCE_LOG,
    label: "Attendance",
    icon: <DoorOpen className="h-4 stroke-2" />,
  },
  {
    id: NavItem.GYM_PRODUCTS,
    label: "Inventory",
    icon: <Package className="h-4 stroke-2" />,
  },
  {
    id: NavItem.SUBSCRIPTIONS,
    label: "Plans",
    icon: <CircleStar className="h-4 stroke-2" />,
  },
];
const system_items = [
  {
    id: NavItem.GYM_EQUIPMENTS,
    label: "Equipments",
    icon: <Dumbbell className="h-4 stroke-2" />,
  },
  {
    id: NavItem.GYM_SETTINGS,
    label: "Settings",
    icon: <Settings className="h-4 stroke-2" />,
  },
];

// const menuItems = [
//   // {
//   //   id: NavItem.ADMIN,
//   //   label: "Admin",
//   //   icon: <UserRoundKey className="h-4 stroke-2" />,
//   //   dividerBefore: true,
//   // },

//   // {
//   //   id: NavItem.AI_INSIGHTS,
//   //   label: "AI Insights",
//   //   icon: <Sparkles className="h-4 stroke-2" />,
//   // },

// ];

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab }) => {
  const [sideBarOn, setSideBarOn] = useState<boolean>(true);

  return (
    <aside
      className={`${sideBarOn ? "w-[14vw]" : "w-[3vw]"} transition-all bg-surface h-screen flex flex-col text-text-secondary`}
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

      <nav className="flex-1 mt-4 space-y-4">
        <div>
          {sideBarOn && (
            <h1 className="uppercase text-text-secondary/50 px-4 font-mulish text-xs">
              Overview
            </h1>
          )}
          {overview_items.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center hover:bg-border border-l-2 ${sideBarOn ? "justify-normal aspect-auto px-2 py-2" : "aspect-square justify-center h-10"} gap-2 transition-all duration-200 ${
                currentTab === item.id
                  ? "text-primary"
                  : " hover:text-text-primary border-surface"
              }`}
            >
              {item.icon}
              {sideBarOn && <span className={`text-sm`}>{item.label}</span>}
            </button>
          ))}
        </div>
        <div className="">
          {sideBarOn && (
            <h1 className="uppercase text-text-secondary/50 px-4 font-mulish text-xs">
              Management
            </h1>
          )}
          {management_items.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center hover:bg-border border-l-2 ${sideBarOn ? "justify-normal aspect-auto px-2 py-2" : "aspect-square justify-center h-10"} gap-2 transition-all duration-200 ${
                currentTab === item.id
                  ? "text-primary"
                  : " hover:text-text-primary border-surface"
              }`}
            >
              {item.icon}
              {sideBarOn && <span className={`text-sm`}>{item.label}</span>}
            </button>
          ))}
        </div>
        <div className="">
          {sideBarOn && (
            <h1 className="uppercase text-text-secondary/50 px-4 font-mulish text-xs">
              Systems
            </h1>
          )}
          {system_items.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center hover:bg-border border-l-2 ${sideBarOn ? "justify-normal aspect-auto px-2 py-2" : "aspect-square justify-center h-10"} gap-2 transition-all duration-200 ${
                currentTab === item.id
                  ? "text-primary"
                  : " hover:text-text-primary border-surface"
              }`}
            >
              {item.icon}
              {sideBarOn && <span className={`text-sm`}>{item.label}</span>}
            </button>
          ))}
        </div>
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
