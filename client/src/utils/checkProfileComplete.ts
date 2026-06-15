import { UserProfile } from "../types/users";

export const checkUserProfile = (profile: UserProfile) => {
  if (!profile) return false;

  let completed = false;

  console.log(profile);

  const userProfile = [
    profile.profile?.heightCm,
    profile.profile?.gender,
    profile.profile?.experienceLevel,
    profile.profile?.birthDate,
    profile.profile?.goal,
    profile.profile?.activityLevel,
  ];

  const currentStats = [profile.currentStats?.weightKg];

  const requiredFields = [...userProfile, ...currentStats];

  completed = requiredFields.every(
    (field) => field !== undefined && field !== null,
  );

  return completed;
};
