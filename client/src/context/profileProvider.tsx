import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { UserProfile } from "../types/users";
import { useAuth } from "./authProvider";
import { authService } from "../services/auth.service";
import {
  SessionData,
  UpdateProfileProps,
  UpdateStatsProps,
  UpdateUserProps,
  UserProfileContextType,
} from "../types/context";
import { CheckInService } from "../services/checkIn.service";
import { checkUserProfile } from "../utils/checkProfileComplete";
import { router } from "expo-router";

const UserProfileContext = createContext<UserProfileContextType | null>(null);

export const UserProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionData | null>(null);

  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoading || profile === null) return;

    const isComplete = checkUserProfile(profile);

    if (!isComplete) {
      router.replace("/(app)/(home)/profile-completion");
    }
  }, [profile, isLoading]);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { user } = await authService.me();
      console.log(user);
      const sessionData = await CheckInService.getSessionStatus();
      console.log(sessionData)

      setSessionStatus(sessionData);
      setProfile(user);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Refresh Error:", err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = async (updates: UpdateUserProps) => {
    setIsLoading(true);
    try {
      const data = await authService.updateUser(user?.id!, updates);

      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...data.user,
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = async (updates: UpdateStatsProps) => {
    setIsLoading(true);
    try {
      const { currentStats } = await authService.updateStats(
        user?.id!,
        updates,
      );

      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          profile: {
            ...prev.currentStats,
            ...currentStats,
          },
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: UpdateProfileProps) => {
    setIsLoading(true);
    try {
      const { profile } = await authService.updateProfile(user?.id!, updates);

      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            ...profile,
          },
        };
      });
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
        updateStats,
        sessionStatus,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const ctx = useContext(UserProfileContext);
  if (!ctx)
    throw new Error("useUserProfile must be used inside UserProfileProvider");
  return ctx;
};
