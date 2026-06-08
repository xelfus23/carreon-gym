import {
  metricsQuery,
  subscriptionQuery,
  userQuery,
} from "../../repositories/user.repository.ts";

export const meDomain = async (params: { userId: number }) => {
  const { userId } = params;

  // Get user data with profile
  const userResult = await userQuery(userId);

  if (userResult.rowCount === 0) {
    throw new Error("User not found");
  }

  const userData = userResult.rows[0];

  // Get latest body metrics
  const metricsResult = await metricsQuery(userId);
  const latestMetric = metricsResult.rows[0] || null;

  // Get subscription info
  const subscriptionResult = await subscriptionQuery(userId);
  const subscription = subscriptionResult.rows[0] || null;

  return {
    id: userData.id,
    firstName: userData.first_name,
    lastName: userData.last_name,
    username: userData.username,
    email: userData.email,
    role: userData.role,
    verified: userData.verified,
    phoneNumber: userData.phone_number,
    profileImageUrl: userData.profile_image_url,
    lastLogin: userData.last_login,
    accountStatus: userData.account_status,
    createdAt: userData.created_at,
    updatedAt: userData.updated_at,

    profile: userData.height_cm
      ? {
        heightCm: userData.height_cm,
        gender: userData.gender,
        birthDate: userData.birth_date,
        goal: userData.goal,
        activityLevel: userData.activity_level,
        experienceLevel: userData.experience_level,
      }
      : null,

    currentStats: latestMetric
      ? {
        weightKg: parseFloat(latestMetric.weight_kg),
        bodyFatPercent: parseFloat(latestMetric.body_fat_percent),
        muscleMassKg: parseFloat(latestMetric.muscle_mass_kg),
        lastRecorded: latestMetric.recorded_at,
      }
      : null,

    subscription: subscription
      ? {
        status: subscription.status,
        planName: subscription.plan_name,
        startDate: subscription.start_date,
        expiryDate: subscription.expiry_date,
        autoRenew: subscription.auto_renew,
      }
      : null,
  };
};
