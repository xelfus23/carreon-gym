import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { UserProfile } from "../types/users";
import { profileService } from "../services/profileService";
import { useAuth } from "./authContext";

interface UserProfileContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
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

    const refreshProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await profileService.getProfile(user?.token!);
            setProfile(data.user);
        } finally {
            setIsLoading(false);
        }
    }, [user?.token]);

    const updateProfile = async (updates: Partial<UserProfile>) => {
        setIsLoading(true);
        try {
            const updated = await profileService.updateProfile(
                user?.token!,
                updates,
            );
            setProfile(updated);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log(user);
        if (user?.token) {
            console.log("RE-FETCHING: ");
            refreshProfile();
        }

        console.log("PROFILE:", profile);
    }, [user, refreshProfile]);

    return (
        <UserProfileContext.Provider
            value={{ profile, isLoading, refreshProfile, updateProfile }}
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
