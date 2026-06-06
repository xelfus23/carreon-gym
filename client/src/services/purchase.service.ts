import { request } from "../utils/request";

export type CreatePurchasePayload = {
  transactionType: "plan" | "product";
  planId?: number;
  planName?: string;
  productId?: number;
  quantity?: number;
  method?: string;
};

export const purchaseService = {

  createPendingPurchase: async (payload: CreatePurchasePayload) => {

    const bodyPayload = {
      transactionType: payload.transactionType,
      method: payload.method ?? "gcash",
      quantity: payload.quantity ?? 1,
      productId: payload.productId,
      planId: payload.planId,
      planName: payload.planName,
    };

    const res = await request(`/purchase`, {
      method: "POST",
      body: JSON.stringify(bodyPayload),
    });

    return res.data;
  },

  uploadReceiptProof: async (purchaseId: number, receiptUrl: string) => {
    const res = await request(`/purchase/${purchaseId}/proof`, {
      method: "PATCH",
      body: JSON.stringify({ receiptUrl })
    })

    return res.data;
  },

  getPaymentHistory: async () => {
    return await (await request(`/purchase/my-history`)).data
  },
};