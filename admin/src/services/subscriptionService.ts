const BASE_URL = "192.168.1.150:4545";
const API_URL = `http://${BASE_URL}`;

export type PlanType = "1_day" | "1_week" | "1_month" | "custom";

export const subscriptionService = {
    async createSubscription(params: {
        user_id: number;
        planType?: PlanType | string;
        durationDays?: number;
        planName?: string;
    }) {
        const res = await fetch(`${API_URL}/api/web/subscriptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(params),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message ?? "Failed to create subscription");
        return data;
    },

    async cancelSubscription(user_id: number) {
        const res = await fetch(`${API_URL}/api/web/subscriptions/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ user_id }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message ?? "Failed to cancel subscription");
        return data;
    },

    async getSubscription(userId: number) {
        const res = await fetch(`${API_URL}/api/web/subscriptions/${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message ?? "Failed to fetch subscription");
        return data;
    },
};
