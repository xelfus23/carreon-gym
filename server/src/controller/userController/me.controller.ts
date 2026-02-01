import type { Request, Response } from "express";
import pool from "../../config/pool.ts";

const meController = async (req: Request, res: Response) => {
    try {
        // 1. Check if user is authenticated (middleware usually handles this)
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        const userId = req.user.id;

        // 2. Fetch User & Profile Data (JOIN users + user_profiles)
        // Note: We use LEFT JOIN so that if they haven't set up a profile yet,
        // we still get the basic user info without crashing.
        const userQuery = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.username,
                u.email,
                u.role,
                u.phone_number,
                u.created_at,
                p.height_cm,
                p.gender,
                p.birth_date,
                p.goal,
                p.activity_level
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.id = $1
        `;

        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rowCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        const userData = userResult.rows[0];

        // 3. Fetch ONLY the LATEST Body Metrics
        // We order by recorded_at DESCending and limit to 1 to get the most recent update.
        const metricsQuery = `
            SELECT weight_kg, body_fat_percent, muscle_mass_kg, recorded_at
            FROM body_metrics
            WHERE user_id = $1
            ORDER BY recorded_at DESC
            LIMIT 1
        `;

        const metricsResult = await pool.query(metricsQuery, [userId]);
        const latestMetric = metricsResult.rows[0] || null; // Handle case where user has no metrics yet

        // 4. Construct the clean JSON response
        // It's good practice to convert DB snake_case to frontend camelCase here
        return res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            data: {
                user: {
                    // Basic Auth Info
                    id: userData.id,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    username: userData.username,
                    email: userData.email,
                    role: userData.role,
                    phoneNumber: userData.phone_number,
                    createdAt: userData.created_at,

                    // Profile Info (may be null if not set up)
                    profile: {
                        heightCm: userData.height_cm,
                        gender: userData.gender,
                        birthDate: userData.birth_date,
                        goal: userData.goal,
                        activityLevel: userData.activity_level,
                    },

                    // Latest Stats (crucial for your AI trainer)
                    currentStats: latestMetric
                        ? {
                              weightKg: latestMetric.weight_kg,
                              bodyFatPercent: latestMetric.body_fat_percent,
                              muscleMassKg: latestMetric.muscle_mass_kg,
                              lastRecorded: latestMetric.recorded_at,
                          }
                        : null,
                },
            },
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error("MeController Error:", err.message);
            return res
                .status(500)
                .json({ success: false, message: "Internal Server Error" });
        }
    }
};

export default meController;
