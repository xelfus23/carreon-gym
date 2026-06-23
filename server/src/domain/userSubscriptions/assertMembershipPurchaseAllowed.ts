import type { PoolClient } from "pg";
import { AppError } from "../../utils/appError.ts";

type MembershipPlan = {
  category: string;
  duration_days: number;
};

function formatDurationLabel(days: number): string {
  if (days <= 1) return "daily";
  if (days < 30) return "weekly";
  return "monthly";
}

export async function assertMembershipPurchaseAllowed(
  client: PoolClient,
  userId: number,
  plan: MembershipPlan,
  durationOverride?: number,
): Promise<void> {
  if (plan.category !== "membership") return;

  const newDuration = durationOverride ?? Number(plan.duration_days);

  const activeMembership = await client.query<{ max_duration: string | null }>(
    `SELECT MAX(sp.duration_days) AS max_duration
     FROM subscriptions s
     INNER JOIN subscription_plans sp ON s.plan_id = sp.id
     WHERE s.user_id = $1
       AND s.status = 'active'
       AND (s.expiry_date IS NULL OR s.expiry_date > CURRENT_TIMESTAMP)
       AND sp.category = 'membership'`,
    [userId],
  );

  const activeDuration = Number(activeMembership.rows[0]?.max_duration ?? 0);
  if (!activeDuration) return;

  if (newDuration < activeDuration) {
    const activeLabel = formatDurationLabel(activeDuration);
    const requestedLabel = formatDurationLabel(newDuration);

    throw new AppError(
      `Cannot purchase a ${requestedLabel} pass while an active ${activeLabel} membership is in effect. Extend or upgrade your current plan instead.`,
      409,
      "MEMBERSHIP_DOWNGRADE_NOT_ALLOWED",
    );
  }
}
