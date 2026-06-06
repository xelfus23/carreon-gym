import { useCallback, useEffect, useState } from "react";
import { purchaseService, CreatePurchasePayload } from "../services/purchase.service";

export const usePayments = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const createPurchase = useCallback(async (payload: CreatePurchasePayload) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      return await purchaseService.createPendingPurchase(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Initialization failed";
      setErrorMsg(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitProof = useCallback(async (purchaseId: number, receiptUrl: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      return await purchaseService.uploadReceiptProof(purchaseId, receiptUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Proof submission failed";
      setErrorMsg(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPurchaseHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await purchaseService.getPaymentHistory();
      setPaymentHistory(data);
      return data
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to fetch history");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getPurchaseHistory()
  }, [getPurchaseHistory])

  return {
    createPurchase,
    submitProof,
    getPurchaseHistory,
    paymentHistory,
    isLoading,
    errorMsg,
    refresh: getPurchaseHistory
  };
};