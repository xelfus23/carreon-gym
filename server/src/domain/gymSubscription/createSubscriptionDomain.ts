import pool from "../../config/pool.ts";
import type { SubscriptionPlanProps } from "../../types/index.ts";

export const createSubscriptionDomain = async (params: SubscriptionPlanProps) => {
  const columns = Object.keys(params);
  const values = Object.values(params);
  const placeholders = columns.map((_, idx) => `$${idx + 1}`);

  const queryText = `
    INSERT INTO subscription_plans (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING id;
  `;

  const subRes = await pool.query(queryText, values);

  return { subscriptionId: subRes.rows[0].id };
};