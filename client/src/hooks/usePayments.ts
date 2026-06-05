import { useState } from "react";
import { purchaseService, CreatePurchasePayload } from "../services/purchaseService";

export const usePayments = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const createPurchase = async (payload: CreatePurchasePayload) => {
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
  };

  const submitProof = async (purchaseId: number, receiptUrl: string) => {
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
  };

  const getPurchaseHistory = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await purchaseService.getPaymentHistory();
      if (res?.success) setPaymentHistory(res.data ?? []);
      return res;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to fetch history");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPurchase,
    submitProof,
    getPurchaseHistory,
    paymentHistory,
    isLoading,
    errorMsg,
  };
};