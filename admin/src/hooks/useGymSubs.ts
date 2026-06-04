import { useCallback, useEffect, useState } from "react";
import { subscriptionService } from "../services/subscription.service";
import type { SubscriptionPlanProps } from "../types";
import { uploadImage } from "../utils/uploadImage";

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

  const createSub = async (data: SubscriptionPlanProps, imageFile: File) => {
    setIsLoading(true);
    setError(null);
    try {
      let icon_url = data.icon_url || "";

      if (imageFile) {
        const upload = await uploadImage(imageFile, "product");
        if (upload?.success && upload.data?.url) icon_url = upload.data.url;
      }

      await subscriptionService.createPlan({ ...(data as SubscriptionPlanProps), icon_url });
      refetch()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save edits"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSub = async (editingId: number, updates: Partial<SubscriptionPlanProps>, imageFile: File) => {
    setIsLoading(true);
    setError(null);
    try {

      const patch: Partial<SubscriptionPlanProps> = { ...updates };

      if (imageFile) {
        const upload = await uploadImage(imageFile, "product");
        if (upload?.success && upload.data?.url) {
          patch.icon_url = upload.data.url;
        }
      }

      await subscriptionService.updatePlan(editingId, patch);

      refetch()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save edits"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  };

  const deleteSub = async (planId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await subscriptionService.deletePlan(planId);
      refetch()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save edits"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }



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
    updateSub,
    deleteSub,
    createSub,
  };
};