import { useCallback, useEffect, useState } from "react";
import { subscriptionService } from "../services/subscription.service";

export type SubscriptionTypes = {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  savings_label?: string;
  is_popular?: boolean;
  icon_url: string;
  category: "membership" | "class" | "personal_training" | "add_on",
  description: string;
};

export const useSubscriptionPlans = () => {
  const [subPlans, setSubPlans] = useState<SubscriptionTypes[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await subscriptionService.getSubscriptionPlans();
      setSubPlans(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to load gym info");
        console.error("Gym Details Fetch Error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getPlans();
  }, [getPlans]);

  return {
    refresh: getPlans,
    subPlans,
    isLoading,
    error,
  };
};
