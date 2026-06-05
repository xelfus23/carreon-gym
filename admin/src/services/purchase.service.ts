import { API_URL } from "../constants";
import type { PurchaseRequestProps } from "../types";
import { authService } from "./auth.service";

// Define the payload structure for your POS items if not already in your types file
export interface ManualTransactionPayload {
  user_id: string | null;
  items: {
    product_id: number;
    quantity: number;
    price_at_purchase: number;
  }[];
  total_amount: number;
  method: string;
  reference_no?: string;
  notes?: string;
}

export const purchaseService = {
  requestPurchase: async (purchaseData: PurchaseRequestProps) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/purchase/request`,
      {
        method: "POST",
        body: JSON.stringify(purchaseData),
      },
    );

    return await result.json();
  },

  createManualTransaction: async (
    transactionData: ManualTransactionPayload,
  ) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/purchase/manual-log`,
      {
        method: "POST",
        body: JSON.stringify(transactionData),
      },
    );

    return await result.json();
  },

  verifyPurchase: async (paymentId: number) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/purchase/verify/${paymentId}`,
      {
        method: "PATCH",
      },
    );

    return await result.json();
  },

  // Admin: Deny a pending purchase (Status: Cancelled)
  denyPurchase: async (paymentId: number) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/purchase/deny/${paymentId}`,
      {
        method: "PATCH",
      },
    );

    return await result.json();
  },

  deleteTransaction: async (paymentId: number) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/purchase/${paymentId}`,
      {
        method: "DELETE",
      },
    );

    return await result.json();
  },

  getAllTransactions: async (userId?: number) => {
    const url = userId
      ? `${API_URL}/api/purchase?userId=${userId}`
      : `${API_URL}/api/purchase`;

    const result = await authService.fetchWithRefresh(url);
    return await result.json();
  },
};
