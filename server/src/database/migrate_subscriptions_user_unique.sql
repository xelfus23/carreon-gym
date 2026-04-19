-- One-time migration: required for INSERT ... ON CONFLICT (user_id) in subscription upserts.
-- If this fails with "duplicate key", resolve duplicate user_id rows in subscriptions first.

ALTER TABLE subscriptions
ADD CONSTRAINT uq_subscriptions_one_per_user UNIQUE (user_id);
