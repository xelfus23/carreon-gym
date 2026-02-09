import { metricsQuery, userQuery } from "../../repositories/user.repository.ts";

export const meDomain = async (params: { userId: number }) => {
    const { userId } = params;

    const userResult = await userQuery(userId);

    if (userResult.rowCount === 0) {
        throw new Error("User not found");
    }

    const userData = userResult.rows[0];

    const metricsResult = await metricsQuery(userId);
    const latestMetric = metricsResult.rows[0] || null;

    return {
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        phoneNumber: userData.phone_number,
        createdAt: userData.created_at,

        profile: {
            heightCm: userData.height_cm,
            gender: userData.gender,
            birthDate: userData.birth_date,
            goal: userData.goal,
            activityLevel: userData.activity_level,
        },

        currentStats: latestMetric
            ? {
                  weightKg: latestMetric.weight_kg,
                  bodyFatPercent: latestMetric.body_fat_percent,
                  muscleMassKg: latestMetric.muscle_mass_kg,
                  lastRecorded: latestMetric.recorded_at,
              }
            : null,
    };
};
