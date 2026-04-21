import { tokenManager } from "../utils/tokenManager";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type PendingPaymentPayload = {
  transactionType: "plan" | "product";
  planId?: number;
  planName?: string;
  productId?: number;
  quantity?: number;
  method?: string;
  receiptUri: string;
};

export async function submitPendingPayment(payload: PendingPaymentPayload) {
  const accessToken = tokenManager.getAccessToken();
  if (!accessToken) throw new Error("Please login first.");

  const formData = new FormData();
  formData.append("method", payload.method ?? "gcash");
  formData.append("quantity", String(payload.quantity ?? 1));

  if (payload.transactionType === "plan") {
    if (payload.planId) formData.append("planId", String(payload.planId));
    if (payload.planName) formData.append("planName", payload.planName);
  } else if (payload.productId) {
    formData.append("productId", String(payload.productId));
  }

  const fileName = payload.receiptUri.split("/").pop() ?? "receipt.jpg";
  formData.append("receipt", {
    uri: payload.receiptUri,
    name: fileName,
    type: "image/jpeg",
  } as any);

  const res = await fetch(`${API_URL}/api/purchase/request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message ?? "Failed to submit payment");
  }

  return data;
}
