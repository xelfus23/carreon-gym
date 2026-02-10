import type { DashboardStats, GymClass, Member, Trainer } from "./types";

export const MOCK_MEMBERS: Member[] = [
    {
        id: "1",
        name: "Alex Rivera",
        email: "alex@example.com",
        plan: "Gold",
        status: "Active",
        joinDate: "2023-08-12",
        attendanceRate: 92,
    },
    {
        id: "2",
        name: "Sarah Chen",
        email: "sarah.c@example.com",
        plan: "Silver",
        status: "Active",
        joinDate: "2023-09-05",
        attendanceRate: 78,
    },
    {
        id: "3",
        name: "Marcus Johnson",
        email: "marcusj@example.com",
        plan: "Bronze",
        status: "Inactive",
        joinDate: "2023-05-20",
        attendanceRate: 45,
    },
    {
        id: "4",
        name: "Elena Gilbert",
        email: "elena.g@example.com",
        plan: "Gold",
        status: "Active",
        joinDate: "2023-11-01",
        attendanceRate: 88,
    },
    {
        id: "5",
        name: "David Smith",
        email: "dave@example.com",
        plan: "Silver",
        status: "Pending",
        joinDate: "2024-01-15",
        attendanceRate: 0,
    },
];

export const MOCK_TRAINERS: Trainer[] = [
    {
        id: "t1",
        name: "Coach Mike",
        specialty: "Bodybuilding",
        activeClients: 15,
        rating: 4.9,
        image: "https://picsum.photos/seed/mike/200",
    },
    {
        id: "t2",
        name: "Jasmine Lee",
        specialty: "Yoga & Mobility",
        activeClients: 22,
        rating: 4.8,
        image: "https://picsum.photos/seed/jas/200",
    },
    {
        id: "t3",
        name: "Victor Vance",
        specialty: "Boxing",
        activeClients: 12,
        rating: 4.7,
        image: "https://picsum.photos/seed/vic/200",
    },
];

export const MOCK_CLASSES: GymClass[] = [
    {
        id: "c1",
        name: "Morning Power Yoga",
        instructor: "Jasmine Lee",
        time: "07:00 AM",
        capacity: 20,
        enrolled: 18,
        type: "Yoga",
    },
    {
        id: "c2",
        name: "High Intensity Blast",
        instructor: "Victor Vance",
        time: "09:00 AM",
        capacity: 15,
        enrolled: 15,
        type: "HIIT",
    },
    {
        id: "c3",
        name: "Weightlifting 101",
        instructor: "Coach Mike",
        time: "05:00 PM",
        capacity: 10,
        enrolled: 7,
        type: "CrossFit",
    },
];

export const REVENUE_DATA = [
    { month: "Jan", revenue: 4500 },
    { month: "Feb", revenue: 5200 },
    { month: "Mar", revenue: 4800 },
    { month: "Apr", revenue: 6100 },
    { month: "May", revenue: 5900 },
    { month: "Jun", revenue: 7200 },
];

export const STATS: DashboardStats = {
    totalMembers: 1284,
    activeRevenue: 124500,
    occupancyRate: 84,
    trainerSatisfaction: 4.8,
};
