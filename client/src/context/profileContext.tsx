import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { UserProfile } from "../types/users";
import { useAuth } from "./authContext";
import { authService } from "../services/authService";

interface UserProfileContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (
        updates: Partial<{
            heightCm: number;
            gender: string;
            birthDate: string;
            goal: string;
            activityLevel: string;
        }>,
    ) => Promise<void>;
    updateUser: (
        updates: Partial<{
            firstName: string;
            lastName: string;
            email: string;
            contactNumber: string;
        }>,
    ) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | null>(null);

export const UserProfileProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        console.log(profile);
    }, [profile]);

    const refreshProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await authService.me();

            console.log("DATA:", data);
            setProfile(data.user);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateUser = async (
        updates: Partial<{
            firstName: string;
            lastName: string;
            email: string;
            contactNumber: string;
        }>,
    ) => {
        setIsLoading(true);
        try {
            const data = await authService.updateUser(user?.id!, updates);

            if (data.success && data.data?.user) {
                setProfile((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        ...data.data.user,
                    };
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (
        updates: Partial<{
            heightCm: number;
            gender: string;
            birthDate: string;
            goal: string;
            activityLevel: string;
        }>,
    ) => {
        setIsLoading(true);
        try {
            const data = await authService.updateProfile(user?.id!, updates);

            if (data.success && data.data?.profile) {
                setProfile((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        profile: {
                            ...prev.profile,
                            ...data.data.profile,
                        },
                    };
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            console.log("RE-FETCHING: ", user.id);
            refreshProfile();
        }
    }, [user, refreshProfile]);

    return (
        <UserProfileContext.Provider
            value={{
                profile,
                isLoading,
                refreshProfile,
                updateProfile,
                updateUser,
            }}
        >
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => {
    const ctx = useContext(UserProfileContext);
    if (!ctx)
        throw new Error(
            "useUserProfile must be used inside UserProfileProvider",
        );
    return ctx;
};
