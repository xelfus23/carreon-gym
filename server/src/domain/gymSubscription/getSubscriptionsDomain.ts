import pool from "../../config/pool.ts";

export const getSubscriptionsDomain = async () => {
  const result = await pool.query(
    `
    SELECT 
      id, 
      name, 
      icon_url, 
      description, 
      price, 
      duration_days, 
      category, 
      is_active, 
      is_popular, 
      savings_label 
    FROM 
      subscription_plans 
    ORDER BY 
      duration_days ASC`,
  );
  return result.rows;
};
