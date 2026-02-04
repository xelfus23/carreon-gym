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
import {
    UpdateProfileProps,
    UpdateUserProps,
    UserProfileContextType,
} from "../types/context";

const UserProfileContext = createContext<UserProfileContextType | null>(null);

export const UserProfileProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const refreshProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await authService.me();

            setProfile(data.user);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateUser = async (updates: UpdateUserProps) => {
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

    const updateProfile = async (updates: UpdateProfileProps) => {
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
