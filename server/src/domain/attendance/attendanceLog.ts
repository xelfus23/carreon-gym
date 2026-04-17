import pool from "../../config/pool.ts";

export const attendanceLogDomain = async () => {
    const attendanceQuery = `
  SELECT 
      ga.id,
      ga.user_id,
      u.first_name,
      u.last_name,
      ga.check_in_time,
      ga.check_out_time,
      ga.status,
      ga.method,

      COALESCE(
          ga.duration_minutes, 
          EXTRACT(EPOCH FROM (ga.check_out_time - ga.check_in_time))/60
      )::INT AS duration

  FROM gym_attendance ga
  JOIN users u ON ga.user_id = u.id
  ORDER BY ga.check_in_time DESC;
  `;

    const attemptsQuery = `
  SELECT
      aa.id,
      aa.user_id,
      u.first_name,
      u.last_name,
      aa.action,
      aa.result,
      aa.reason,
      aa.metadata,
      aa.created_at
  FROM attendance_attempts aa
  JOIN users u ON aa.user_id = u.id
  ORDER BY aa.created_at DESC
  LIMIT 250;
  `;

    const [attendanceResult, attemptsResult] = await Promise.all([
        pool.query(attendanceQuery),
        pool.query(attemptsQuery),
    ]);

    return {
        sessions: attendanceResult.rows,
        attempts: attemptsResult.rows,
    };
};
