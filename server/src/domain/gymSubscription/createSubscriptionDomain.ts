import pool from "../../config/pool.ts";
import type { SubscriptionPlanProps } from "../../types/index.ts";


export const createSubscriptionDomain = async (data: SubscriptionPlanProps) => {
  const query = `INSERT INTO subscription_plans (name,  description, price, duration_days, is_active, icon_url, category) VALUES ($1, $2, $3, $4, $5, $6, $7)`
  const result = await pool.query(query, [data.name, data.description, data.price, data.duration_days, data.is_active, data.icon_url, data.category]);
  return result.rows[0]
}