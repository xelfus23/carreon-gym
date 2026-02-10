export enum NavItem {
    DASHBOARD = "DASHBOARD",
    MEMBERS = "MEMBERS",
    TRAINERS = "TRAINERS",
    CLASSES = "CLASSES",
    AI_INSIGHTS = "AI_INSIGHTS",
    SETTINGS = "SETTINGS",
}

export interface Member {
    id: string;
    name: string;
    email: string;
    plan: "Gold" | "Silver" | "Bronze";
    status: "Active" | "Inactive" | "Pending";
    joinDate: string;
    attendanceRate: number;
}

export interface Trainer {
    id: string;
    name: string;
    specialty: string;
    activeClients: number;
    rating: number;
    image: string;
}

export interface GymClass {
    id: string;
    name: string;
    instructor: string;
    time: string;
    capacity: number;
    enrolled: number;
    type: "Yoga" | "HIIT" | "CrossFit" | "Boxing";
}

export interface DashboardStats {
    totalMembers: number;
    activeRevenue: number;
    occupancyRate: number;
    trainerSatisfaction: number;
}
