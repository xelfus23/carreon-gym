import { API_URL } from "../constants";
import type { PurchaseRequestProps } from "../types";
import { authService } from "./auth.service";

export const purchaseService = {
  // Member: Request a new product purchase (Status: Pending)
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

  // Admin: Verify a pending purchase (Status: Paid)
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
