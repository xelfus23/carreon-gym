export const mapAdminData = (user: any) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    role: user.role,
    verified: user.verified,
    createdAt: user.createdAt,
});

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
    subscription: user.subscription
        ? {
              status: user.subscription.status,
              planName: user.subscription.planName,
              startDate: user.subscription.startDate,
              expiryDate: user.subscription.expiryDate,
          }
        : null,
});
