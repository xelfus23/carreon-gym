import { request } from "../utils/request";

export const subscriptionService = {
    getSubscription: async () => {
        return (await request(`/gym-subscriptions/me`)).data;
    },
    getSubscriptionHistory: async () => {
        return (await request(`/subscriptions/me/history`)).data;
    },
    getSubscriptionPlans: async () => {
        return (await request(`/gym-subscriptions`)).data;
    },
    getSubscriptionPlan: async (planId: string) => {
        return (await request(`/gym-subscriptions/${planId}`)).data;
    },
};
