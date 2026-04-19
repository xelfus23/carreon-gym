import { authService } from "./auth.service";

const API_URL = import.meta.env.VITE_BASE_URL;

export interface PurchaseRequest {
    productId: number;
    quantity: number;
    method: string;
}

export const purchaseService = {
    // Member: Request a new product purchase (Status: Pending)
    requestPurchase: async (purchaseData: PurchaseRequest) => {
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

    // Admin/Member: Get transaction history (optional userId filter)
    getAllTransactions: async (userId?: number) => {
        const url = userId
            ? `${API_URL}/api/purchase?userId=${userId}`
            : `${API_URL}/api/purchase`;

        const result = await authService.fetchWithRefresh(url);

        return await result.json();
    },
};
