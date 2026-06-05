import { tokenManager } from "../utils/tokenManager";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type CreatePurchasePayload = {
  transactionType: "plan" | "product";
  planId?: number;
  planName?: string;
  productId?: number;
  quantity?: number;
  method?: string;
};

export const purchaseService = {
  // Phase 1: Initialize the tracking record in the DB
  createPendingPurchase: async (payload: CreatePurchasePayload) => {
    const accessToken = tokenManager.getAccessToken();
    if (!accessToken) throw new Error("Please login first.");

    const bodyPayload = {
      method: payload.method ?? "gcash",
      quantity: payload.quantity ?? 1,
      transactionType: payload.transactionType,
      status: "pending", // Starts as pending, awaiting proof
      ...(payload.transactionType === "plan"
        ? { planId: payload.planId, planName: payload.planName }
        : { productId: payload.productId }),
    };

    const res = await fetch(`${API_URL}/api/purchase/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.message ?? "Failed to create purchase request.");
    }
    return data; // Should return { success: true, data: { id: 123, ... } }
  },

  // Phase 2: Link S3 asset link directly to the transaction row ID
  uploadReceiptProof: async (purchaseId: number, receiptUrl: string) => {
    const accessToken = tokenManager.getAccessToken();
    if (!accessToken) throw new Error("Please login first.");

    const res = await fetch(`${API_URL}/api/purchase/${purchaseId}/proof`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ receiptUrl }),
    });

    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.message ?? "Failed to link payment proof.");
    }
    return data;
  },

  getPaymentHistory: async () => {
    const accessToken = tokenManager.getAccessToken();
    if (!accessToken) throw new Error("Please login first.");

    const res = await fetch(`${API_URL}/api/purchase/history`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "Failed to load payment records.");
    return data;
  },
};