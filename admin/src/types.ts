export enum NavItem {
    DASHBOARD = "DASHBOARD",
    QR_CODE = "QR_CODE",
    MEMBERS = "MEMBERS",
    GYM_EQUIPMENTS = "GYM_EQUIPMENTS",
    AI_INSIGHTS = "AI_INSIGHTS",
}

export type SubscriptionStatus = "active" | "expired" | "pending" | "cancelled";

export type AccountStatus = "active" | "suspended" | "deleted";

export interface AdminMemberListItem {
    id: number;
    role: "member" | "admin";
    // Basic Info
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    verified: boolean;
    account_status: AccountStatus;
    last_login: string | null; // ISO string
    created_at: string; // ISO string

    // Subscription Info (nullable because LEFT JOIN)
    plan_name: string | null;
    subscription_status: SubscriptionStatus | null;
    expiry_date: string | null;

    // Latest Body Metric (nullable)
    weight_kg: number | null;
    weight_recorded_at: string | null;

    // Attendance
    last_check_in: string | null; // ISO string
    total_visits_all_time: number | null;
    total_visits_this_month: number | null;
    attendance_rate: number;
}

export interface SubscriptionModalProps {
    member: AdminMemberListItem | null;
    onClose: () => void;
    onSuccess: () => void;
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
