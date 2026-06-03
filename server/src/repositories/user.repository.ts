// repositories/user.repository.ts
import pool from "../config/pool.ts";

export const userQuery = async (userId: number) => {
  return await pool.query(
    `SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.phone_number,
            u.email,
            u.role,
            u.verified,
            u.profile_image_url,
            u.last_login,
            u.account_status,
            u.created_at,
            u.updated_at,
            p.height_cm,
            p.gender,
            p.birth_date,
            p.goal,
            p.activity_level
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = $1`,
    [userId],
  );
};

export const chatQuery = async (sessionId: string | number) => {
  return await pool.query(
    `SELECT 
          role, 
          content, 
          tool_calls, 
          name, 
          tool_call_id, 
          created_at
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
    [sessionId],
  );
};

export const summaryQuery = async (userId: number) => {
  const summaryResult = await pool.query(
    `
            SELECT 
                conversation_summary 
            FROM 
                chat_sessions 
            WHERE 
                user_id = $1
        `,
    [userId],
  );

  return summaryResult.rows[0].conversation_summary;
};

export const metricsQuery = async (userId: number) => {
  return await pool.query(
    `SELECT 
            weight_kg,
            body_fat_percent,
            muscle_mass_kg,
            recorded_at
        FROM body_metrics
        WHERE user_id = $1
        ORDER BY recorded_at DESC
        LIMIT 1`,
    [userId],
  );
};

export const subscriptionQuery = async (userId: number) => {
  return await pool.query(
    `SELECT 
            plan_name,
            start_date,
            expiry_date,
            auto_renew,
            CASE
                WHEN status = 'cancelled' THEN 'cancelled'
                WHEN status = 'pending' THEN 'pending'
                WHEN expiry_date < CURRENT_TIMESTAMP THEN 'expired'
                ELSE 'active'
            END AS status
        FROM subscriptions
        WHERE user_id = $1`,
    [userId],
  );
};

export const updateUserQuery = async (
  userId: number,
  updates: {
    firstName?: string;
    lastName?: string;
    username?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
  },
) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.firstName !== undefined) {
    fields.push(`first_name = $${paramCount++}`);
    values.push(updates.firstName);
  }
  if (updates.lastName !== undefined) {
    fields.push(`last_name = $${paramCount++}`);
    values.push(updates.lastName);
  }
  if (updates.username !== undefined) {
    fields.push(`username = $${paramCount++}`);
    values.push(updates.username);
  }
  if (updates.phoneNumber !== undefined) {
    fields.push(`phone_number = $${paramCount++}`);
    values.push(updates.phoneNumber);
  }
  if (updates.profileImageUrl !== undefined) {
    fields.push(`profile_image_url = $${paramCount++}`);
    values.push(updates.profileImageUrl);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  values.push(userId);

  return await pool.query(
    `UPDATE users 
         SET ${fields.join(", ")}
         WHERE id = $${paramCount}
         RETURNING *`,
    values,
  );
};

export const updateProfileQuery = async (
  userId: number,
  updates: {
    heightCm?: number;
    gender?: string;
    birthDate?: Date;
    goal?: string;
    activityLevel?: string;
  },
) => {
  const keys = Object.keys(updates);

  if (keys.length === 0) throw new Error("No fields to update");

  const columns = keys.map((k) => k.replace(/([A-Z])/g, "_$1").toLowerCase());

  const values = keys.map((k) => (updates as any)[k]);

  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

  const updateSet = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");

  values.push(userId);
  const userIdParamIndex = values.length;

  const query = `
      INSERT INTO user_profiles (user_id, ${columns.join(", ")})
      VALUES ($${userIdParamIndex}, ${placeholders})
      ON CONFLICT (user_id) 
      DO UPDATE SET ${updateSet}, updated_at = NOW()
      RETURNING *
  `;

  const res = await pool.query(query, values);
  return res.rows[0]; // Return the object, not the whole result set
};

export const addBodyMetricQuery = async (userId: number, metrics: any) => {
  const res = await pool.query(
    `INSERT INTO body_metrics (user_id, weight_kg, body_fat_percent, muscle_mass_kg)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
    [
      userId,
      metrics.weightKg,
      metrics.bodyFatPercent,
      metrics.muscleMassKg,
    ],
  );
  return res.rows[0];
};

export const getBodyMetricsHistoryQuery = async (
  userId: number,
  limit = 30,
) => {
  return await pool.query(
    `SELECT 
            weight_kg,
            body_fat_percent,
            muscle_mass_kg,
            recorded_at
         FROM body_metrics
         WHERE user_id = $1
         ORDER BY recorded_at DESC
         LIMIT $2`,
    [userId, limit],
  );
};
