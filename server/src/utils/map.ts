export const mapUserData = (user: any) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  email: user.email,
  role: user.role,
  verified: user.verified,
  phoneNumber: user.phoneNumber,
  profileImageUrl: user.profileImageUrl,
  createdAt: user.createdAt,
  profile: user.profile
    ? {
        heightCm: user.profile.heightCm,
        gender: user.profile.gender,
        birthDate: user.profile.birthDate,
        goal: user.profile.goal,
        activityLevel: user.profile.activityLevel,
        experienceLevel: user.profile.experienceLevel,
      }
    : null,
  currentStats: user.currentStats
    ? {
        weightKg: user.currentStats.weightKg,
        bodyFatPercent: user.currentStats.bodyFatPercent,
        muscleMassKg: user.currentStats.muscleMassKg,
        lastRecorded: user.currentStats.lastRecorded,
      }
    : null,
  subscriptions: (user.subscriptions ?? []).map((sub: {
    id?: string;
    status: string;
    planName: string;
    category?: string;
    startDate?: string | Date | null;
    expiryDate?: string | Date | null;
  }) => ({
    id: sub.id,
    status: sub.status,
    planName: sub.planName,
    category: sub.category,
    startDate: sub.startDate,
    expiryDate: sub.expiryDate,
  })),
  subscription: user.subscription
    ? {
        id: user.subscription.id,
        status: user.subscription.status,
        planName: user.subscription.planName,
        category: user.subscription.category,
        startDate: user.subscription.startDate,
        expiryDate: user.subscription.expiryDate,
      }
    : null,
});
