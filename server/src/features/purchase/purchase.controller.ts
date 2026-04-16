import { broadcastNotification } from "../../ai/websocketHandler.ts";
import { getTransactionsDomain } from "../../domain/purchase/getTransactionsDomain.ts";
import {
    createPendingPurchaseDomain,
    verifyProductPurchaseDomain,
} from "../../domain/purchase/transactionsDomain.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import type { Request, Response } from "express";

export const requestPurchase = catchAsync(
    async (req: Request, res: Response) => {
        const { productId, quantity, method } = req.body;
        const userId = req.user?.id;

        const data = await createPendingPurchaseDomain(
            userId!,
            productId,
            quantity,
            method,
        );

        // Notify Admin using data from the database result
        broadcastNotification("NEW_PENDING_PAYMENT", {
            userId: userId,
            member: data.member_name,
            amount: data.amount,
            item: data.item_name,
        });

        res.status(201).json({
            success: true,
            message: "Purchase request sent. Please pay at the counter.",
            data,
        });
    },
);

// Admin Dashboard: PATCH /api/products/verify-purchase/:paymentId
export const verifyPurchase = catchAsync(
    async (req: Request, res: Response) => {
        const { paymentId } = req.params;
        const adminId = req.user?.id;

        const data = await verifyProductPurchaseDomain(
            Number(paymentId),
            adminId!,
        );

        broadcastNotification("PAYMENT_VERIFIED", {
            userId: data.user_id,
            status: "paid",
            item: data.item_name,
        });

        res.status(200).json({
            success: true,
            message: "Payment verified and stock updated",
            data,
        });
    },
);

export const getAllTransactions = catchAsync(
    async (req: Request, res: Response) => {
        const { userId } = req.query;

        const transactions = await getTransactionsDomain(
            userId ? Number(userId) : undefined,
        );

        res.status(200).json({
            success: true,
            results: transactions.length,
            data: transactions,
        });
    },
);