import { broadcastNotification } from "../../ai/websocketHandler.ts";
import {
    createPendingPurchaseDomain,
    verifyProductPurchaseDomain,
} from "../../domain/purchase/transactionsDomain.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import type { Request, Response } from "express";

export const requestPurchase = catchAsync(
    async (req: Request, res: Response) => {
        const { productId, quantity, method } = req.body;
        const userId = req.user?.id; // From JWT

        const data = await createPendingPurchaseDomain(
            userId!,
            productId,
            quantity,
            method,
        );

        // Notify Admin in Real-time via Socket.io
        broadcastNotification("NEW_PENDING_PAYMENT", {
            member: req.user.name,
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
        const adminId = req.user.id;

        const data = await verifyProductPurchaseDomain(
            Number(paymentId),
            adminId,
        );

        // Notify Member in Real-time
        io.emit(`payment_verified_${data.user_id}`, data);

        res.status(200).json({
            success: true,
            message: "Payment verified and stock updated",
            data,
        });
    },
);
