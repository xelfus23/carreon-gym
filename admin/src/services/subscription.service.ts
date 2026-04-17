import { authService } from "./auth.service";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_URL = `http://${BASE_URL}`;

export interface SubscriptionPlan {
    id: number;
    name: string;
    description: string | null;
    price: number;
    duration_days: number;
    is_custom: boolean;
}

export const subscriptionService = {
    async getPlans(): Promise<SubscriptionPlan[]> {
        const res = await authService.fetchWithRefresh(
            `${API_URL}/api/web/subscriptions/plans`,
            { method: "GET" },
        );

        const data = await res.json();

        if (!data.success)
            throw new Error(data.message ?? "Failed to fetch plans");

        return data.data;
    },

    async createSubscription(params: {
        user_id: number;
        plan_id: number;
        amount_override?: number;
        duration_override?: number;
        method?: string;
        reference_no?: string;
        notes?: string;
    }) {
        const res = await authService.fetchWithRefresh(
            `${API_URL}/api/web/subscriptions`,
            {
                method: "POST",
                body: JSON.stringify(params),
            },
        );

        const data = await res.json();

        if (!data.success)
            throw new Error(data.message ?? "Failed to create subscription");

        return data;
    },

    async cancelSubscription(user_id: number) {
        const res = await authService.fetchWithRefresh(
            `${API_URL}/api/web/subscriptions/cancel`,
            {
                method: "POST",
                body: JSON.stringify({ user_id }),
            },
        );
        const data = await res.json();
        if (!data.success)
            throw new Error(data.message ?? "Failed to cancel subscription");
        return data;
    },

    async resetSubscription(user_id: number) {
        const res = await authService.fetchWithRefresh(
            `${API_URL}/api/web/subscriptions/reset`,
            {
                method: "POST",
                body: JSON.stringify({ user_id }),
            },
        );
        const data = await res.json();
        if (!data.success)
            throw new Error(data.message ?? "Failed to reset subscription");
        return data;
    },

    async getSubscription(userId: number) {
        const res = await authService.fetchWithRefresh(
            `${API_URL}/api/web/subscriptions/${userId}`,
            {
                method: "GET",
            },
        );
        const data = await res.json();
        if (!data.success)
            throw new Error(data.message ?? "Failed to fetch subscription");
        return data;
    },

    async getPaymentHistory(userId: number) {
        const res = await authService.fetchWithRefresh(
            `${API_URL}/api/web/subscriptions/${userId}/payments`,
            {
                method: "GET",
            },
        );
        const data = await res.json();
        if (!data.success)
            throw new Error(data.message ?? "Failed to fetch payment history");
        return data;
    },
};
