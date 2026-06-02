import { broadcastNotification } from "../../ai/websocketHandler.ts";
import { getTransactionsDomain } from "../../domain/purchase/getTransactionsDomain.ts";
import {
  createPendingPurchaseDomain,
  deleteTransactionDomain,
  denyPendingPurchaseDomain,
  verifyPendingPurchaseDomain,
} from "../../domain/purchase/transactionsDomain.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import type { Request, Response } from "express";

export const requestPurchase = catchAsync(
  async (req: Request, res: Response) => {
    const { productId, planId, planName, quantity, method } = req.body;
    const userId = req.user?.id;
    const file = req.file as any;

    console.log(productId, planId, planName, quantity, method);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await createPendingPurchaseDomain(
      userId,
      productId ? Number(productId) : undefined,
      planId ? Number(planId) : undefined,
      planName ? String(planName) : undefined,
      quantity ? Number(quantity) : 1,
      method ?? "gcash",
      file?.location,
    );

    broadcastNotification("NEW_PENDING_PAYMENT", {
      userId: userId,
      member: data.member_name,
      amount: data.amount,
      item: data.item_name,
    });

    res.status(201).json({
      success: true,
      message: "Payment submitted for verification.",
      data,
    });
  },
);

export const verifyPurchase = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const adminId = req.user?.id;

    const data = await verifyPendingPurchaseDomain(Number(paymentId), adminId!);

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

export const denyPurchase = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const data = await denyPendingPurchaseDomain(Number(paymentId), adminId);

  broadcastNotification("PAYMENT_DENIED", {
    userId: data.user_id,
    status: "cancelled",
    transactionId: data.id,
  });

  res.status(200).json({
    success: true,
    message: "Payment request denied",
    data,
  });
});

export const deleteTransaction = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    const data = await deleteTransactionDomain(Number(paymentId));

    broadcastNotification("TRANSACTION_DELETED", {
      transactionId: data.id,
    });

    res.status(200).json({
      success: true,
      message: "Transaction deleted",
      data,
    });
  },
);

export const getAllTransactions = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.query;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    const resolvedUserId =
      requesterRole === "member"
        ? requesterId
        : userId
          ? Number(userId)
          : undefined;

    const transactions = await getTransactionsDomain(resolvedUserId);

    res.status(200).json({
      success: true,
      results: transactions.length,
      data: transactions,
    });
  },
);
