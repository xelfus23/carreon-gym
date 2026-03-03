import { request } from "../utils/request";

export const subscriptionService = {
    getSubscription: async () => {
        return (await request(`/subscriptions/me`)).data;
    },
    getSubscriptionHistory: async () => {
        return (await request(`/subscriptions/me/history`)).data;
    },
    getSubscriptionPlans: async () => {
        return (await request(`/subscriptions/plans`)).data;
    },
    getSubscriptionPlan: async (planId: string) => {
        return (await request(`/subscriptions/plans/${planId}`)).data;
    },
};
