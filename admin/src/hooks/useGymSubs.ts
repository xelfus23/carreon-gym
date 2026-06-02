import { useCallback, useEffect, useState } from "react";
import { subscriptionService } from "../services/subscription.service";
import type { SubscriptionPlanProps } from "../types";

export const useGymSubs = () => {
  const [membership, setMembership] = useState<SubscriptionPlanProps[]>([]);
  const [classes, setClasses] = useState<SubscriptionPlanProps[]>([]);
  const [personalTrainer, setPersonalTrainer] = useState<SubscriptionPlanProps[]>([]);
  const [addOns, setAddOns] = useState<SubscriptionPlanProps[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<null | string>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await subscriptionService.getPlans();
      setMembership(data.filter(v => v.category === 'membership'));
      setClasses(data.filter(v => v.category === 'class'));
      setPersonalTrainer(data.filter(v => v.category === 'personal_training'));
      setAddOns(data.filter(v => v.category === 'add_on'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get subscriptions";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveEdit = async (editingId: number, editForm: Partial<SubscriptionPlanProps>) => {
    setIsLoading(true);
    setError(null);
    try {
      await subscriptionService.updatePlan(editingId!, editForm);
      refetch()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save edits"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  };



  useEffect(() => {
    refetch()
  }, [refetch]);

  return {
    membership,
    classes,
    personalTrainer,
    addOns,
    isLoading,
    error,
    refresh: refetch,
    saveEdit,
  };
};