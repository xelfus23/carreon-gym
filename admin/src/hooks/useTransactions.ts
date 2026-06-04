import { useState, useEffect, useCallback } from "react";
import { purchaseService } from "../services/purchase.service";
import { getWsUrl } from "../utils/getWsUrl";

export type TransactionProps = {
  transaction_id: number;
  user_id: number;
  member_name: string;
  transaction_type: "plan" | "product";
  item_name: string;
  amount: number;
  method: string;
  status: "pending" | "paid" | "cancelled";
  paid_at: string;
  reference_no: string | null;
  receipt_image_url?: string | null;
};

export const useTransactions = (userId?: number) => {
  const [transactions, setTransactions] = useState<TransactionProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await purchaseService.getAllTransactions(userId);
      setTransactions(result.data || result);
    } catch (err) {
      setError("Failed to load transaction logs");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial Load
  useEffect(() => {
    getTransactions();
  }, [getTransactions]);

  useEffect(() => {
    const BASE_URL = import.meta.env.VITE_SERVER_URL;
    const wsUrl = getWsUrl(BASE_URL, "/ws/admin");

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // console.log("🚀 Transaction WebSocket Connected");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "SYSTEM_NOTIFICATION") {
          if (
            message.event === "NEW_PENDING_PAYMENT" ||
            message.event === "PAYMENT_VERIFIED" ||
            message.event === "PAYMENT_DENIED" ||
            message.event === "TRANSACTION_DELETED"
          ) {
            getTransactions();
          }
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WS Error:", error);
    };

    // This is the critical cleanup part
    return () => {
      // 1. Remove listeners so they don't trigger during unmount
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;

      // 2. Only close if it's not already closed
      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        ws.close();
      }
    };
  }, [getTransactions]);


  const verifyTransaction = async (paymentId: number) => {
    try {
      const result = await purchaseService.verifyPurchase(paymentId);

      if (!result?.success) {
        throw new Error(result?.message || "Failed to verify payment");
      }

      getTransactions()
    } catch (err) {
      console.error(err);
    }
  };

  const denyTransaction = async (paymentId: number) => {
    try {
      const result = await purchaseService.denyPurchase(paymentId);

      if (!result?.success) {
        throw new Error(result?.message || "Failed to deny payment");
      }

      getTransactions()

    } catch (err) {
      console.error(err);
    }
  };

  const deleteTransaction = async (paymentId: number) => {
    try {
      const result = await purchaseService.deleteTransaction(paymentId);
      if (!result?.success) {
        throw new Error(result?.message || "Failed to delete transaction");
      }
    } catch (err) {
      console.error(err);
    }
  };


  return {
    transactions,
    isLoading,
    error,
    refresh: getTransactions,
    verifyTransaction,
    denyTransaction,
    deleteTransaction
  };
};
