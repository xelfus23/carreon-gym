import { AuthUser, UserProfile } from "./users";

export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    register: (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        contactNumber: string,
    ) => Promise<boolean>;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    user: AuthUser | null;
}

export interface UserProfileContextType {
    profile: UserProfile | null;
    sessionStatus: SessionData | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: UpdateProfileProps) => Promise<void>;
    updateUser: (updates: UpdateUserProps) => Promise<void>;
}

export type UpdateProfileProps = Partial<{
    heightCm: number;
    gender: string;
    birthDate: string;
    goal: string;
    activityLevel: string;
}>;

export type UpdateUserProps = Partial<{
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
}>;

export type SessionData = {
    has_active_session: boolean;
    session: {
        checked_in_at: string;
        current_duration_minutes: number;
        session_id: number;
        status: "checked_in" | "checked_out";
    };
};
