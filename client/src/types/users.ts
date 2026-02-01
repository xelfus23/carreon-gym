export type AuthUser = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: "member" | "trainer" | "admin";
    token?: string;
};

export type Profile = {
    heightCm: number;
    gender: "male" | "female" | "other";
    birthDate: Date;
    goal: string;
    activityLevel:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active";
};

export type CurrentStats = {
    weightKg: number;
    bodyFatPercent: number;
    muscleMassKg: number;
    lastRecorded: Date;
    recorded_at: Date;
};

export type UserProfile = {
    id: number;
    firstName: string;
    lastName: string;
    username?: string;
    email: string;
    role: string;
    phoneNumber: string;
    profile: Profile;
    currentStats?: CurrentStats;
    createdAt: string;
};
