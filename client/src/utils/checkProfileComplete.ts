import { UserProfile } from "../types/users";

export const checkUserProfile = (profile: UserProfile) => {
    if (!profile) return false;

    let completed = false;

    const userProfile = [
        profile.profile?.heightCm,
        profile.profile?.gender,
        profile.profile?.birthDate,
        profile.profile?.goal,
        profile.profile?.activityLevel,
    ];

    const currentStats = [
        profile.currentStats?.weightKg,
        profile.currentStats?.bodyFatPercent,
        profile.currentStats?.muscleMassKg,
    ];

    const requiredFields = [...userProfile, ...currentStats];

    completed = requiredFields.every(
        (field) => field !== undefined && field !== null,
    );

    return completed;
};
