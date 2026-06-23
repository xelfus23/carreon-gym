import type { Subscription, SubscriptionStatus } from "../types/users";

export function getUserSubscriptions(
  profile?: { subscriptions?: Subscription[]; subscription?: Subscription | null } | null,
): Subscription[] {
  if (profile?.subscriptions?.length) {
    return profile.subscriptions;
  }

  if (profile?.subscription) {
    return [profile.subscription];
  }

  return [];
}

export function hasActiveSubscription(
  profile?: { subscriptions?: Subscription[]; subscription?: Subscription | null } | null,
): boolean {
  return getUserSubscriptions(profile).some((sub) => sub.status === "active");
}

export function getActiveSubscriptions(
  profile?: { subscriptions?: Subscription[]; subscription?: Subscription | null } | null,
): Subscription[] {
  return getUserSubscriptions(profile).filter((sub) => sub.status === "active");
}

export function getSubscriptionStatusColor(status?: SubscriptionStatus | string): string {
  switch (status?.toLowerCase()) {
    case "active":
      return "text-primary";
    case "expired":
    case "cancelled":
      return "text-danger";
    case "pending":
      return "text-yellow-500";
    default:
      return "text-text-secondary";
  }
}

export function getSubscriptionStatusBadge(status: SubscriptionStatus | string): string {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-primary/20 text-primary";
    case "expired":
      return "bg-danger/20 text-danger";
    case "cancelled":
      return "bg-danger/15 text-danger";
    case "pending":
      return "bg-yellow-500/20 text-yellow-500";
    default:
      return "bg-border text-text-secondary";
  }
}

export function formatSubscriptionCategory(category?: string): string {
  if (!category) return "Membership";

  return category
    .replaceAll(/_+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatSubscriptionStatus(status?: string): string {
  if (!status) return "Unknown";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getSubscriptionSummary(
  profile?: { subscriptions?: Subscription[]; subscription?: Subscription | null } | null,
): {
  headline: string;
  subtitle: string | null;
  status: SubscriptionStatus | "none";
} {
  const subscriptions = getUserSubscriptions(profile);
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === "active");

  if (activeSubscriptions.length === 0) {
    const primary = subscriptions[0];

    if (!primary) {
      return {
        headline: "No Active Plan",
        subtitle: null,
        status: "none",
      };
    }

    return {
      headline: formatSubscriptionStatus(primary.status),
      subtitle: primary.planName,
      status: primary.status,
    };
  }

  if (activeSubscriptions.length === 1) {
    return {
      headline: activeSubscriptions[0].planName,
      subtitle: formatSubscriptionCategory(activeSubscriptions[0].category),
      status: "active",
    };
  }

  return {
    headline: `${activeSubscriptions.length} Active Plans`,
    subtitle: activeSubscriptions.map((sub) => sub.planName).join(" · "),
    status: "active",
  };
}
