import { API_URL } from "../constants";
import type { SubscriptionPlanProps } from "../types";
import { authService } from "./auth.service";

export const subscriptionService = {

  createPlan: async (subsData: SubscriptionPlanProps) => {
    const res = await authService.fetchWithRefresh(`${API_URL}/api/gym-subscriptions`, {
      method: "POST",
      body: JSON.stringify(subsData)
    });

    const data = await res.json();

    return data.data;
  },

  updatePlan: async (id: number, planData: Partial<SubscriptionPlanProps>) => {
    const res = await authService.fetchWithRefresh(`${API_URL}/api/gym-subscriptions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(planData)
    });

    const data = await res.json();

    return data.data;
  },

  deletePlan: async (id: number) => {
    return await authService.fetchWithRefresh(`${API_URL}/api/gym-subscriptions/${id}`, {
      method: "DELETE"
    })
  },

  async getPlans(): Promise<SubscriptionPlanProps[]> {
    const res = await authService.fetchWithRefresh(
      `${API_URL}/api/gym-subscriptions`,
      { method: "GET" },
    );

    const data = await res.json();

    if (!data.success) throw new Error(data.message ?? "Failed to fetch plans");

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
      `${API_URL}/api/user-subscriptions`,
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
      `${API_URL}/api/user-subscriptions/cancel`,
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
      `${API_URL}/api/user-subscriptions/reset`,
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
      `${API_URL}/api/user-subscriptions/${userId}`,
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
      `${API_URL}/api/user-subscriptions/${userId}/payments`,
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
