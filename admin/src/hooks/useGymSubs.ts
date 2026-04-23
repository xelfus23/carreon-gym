import { useCallback, useEffect, useState } from "react";
import { type SubscriptionPlan, subscriptionService } from "../services/subscription.service";

export const useGymSubs = () => {
  const [membership, setMembership] = useState<SubscriptionPlan[]>([]);
  const [classes, setClasses] = useState<SubscriptionPlan[]>([]);
  const [personalTrainer, setPersonalTrainer] = useState<SubscriptionPlan[]>([]);
  const [addOns, setAddOns] = useState<SubscriptionPlan[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<null | string>(null);

  const getSubs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await subscriptionService.getPlans();

      console.log(data)

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


  const saveEdit = async (editingId: number, editForm: Partial<SubscriptionPlan>) => {
    await subscriptionService.updatePlan(editingId!, editForm);
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };


  useEffect(() => {
    getSubs();
  }, [getSubs]);

  return {
    membership,
    classes,
    personalTrainer,
    addOns,
    isLoading,
    error,
    refresh: getSubs,
    saveEdit,
    formatCurrency,
  };
};