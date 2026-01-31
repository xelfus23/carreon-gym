export type AuthUser = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: "member" | "trainer" | "admin";
    token?: string;
};

export type UserProfile = {
    id: number;
    firstName: string;
    lastName: string;
    username?: string;
    email: string;

    profile: {
        birthDate?: {
            year: number;
            month: number;
            day: number;
        };
        gender?: "male" | "female" | "other";
        phoneNumber?: string;
        metrics?: {
            height?: number;
            weight?: number;
            bodyFatPercentage?: number;
        };
        fitnessGoals?: string[];
        membership?: {
            type: "basic" | "premium" | "vip";
            startDate: string;
            endDate: string;
            isActive: boolean;
        };
    };

    createdAt: string;
    updatedAt?: string;
};
