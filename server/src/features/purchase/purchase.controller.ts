import { broadcastNotification } from "../../ai/websocketHandler.ts";
import { createManualTransactionDomain } from "../../domain/purchase/createManualTransactionDomain.ts";
import { createPaymentDomain } from "../../domain/purchase/createPaymentDomain.ts";
import { deletePaymentDomain } from "../../domain/purchase/deletePaymentDomain.ts";
import { denyPaymentDomain } from "../../domain/purchase/denyPaymentDomain.ts";
import { getTransactionsDomain } from "../../domain/purchase/getTransactionsDomain.ts";
import { updateReceiptProofDomain } from "../../domain/purchase/updateReceiptProofDomain.ts";
import { verifyPaymentDomain } from "../../domain/purchase/verifyPaymentDomain.ts";

import { catchAsync } from "../../utils/catchAsync.ts";
import type { Request, Response } from "express";

export const manualLogPurchase = catchAsync(
  async (req: Request, res: Response) => {
    const { user_id, items, method, reference_no, notes } = req.body;

    // Validate cart payload layout structure
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot log an empty POS transaction cart.",
      });
    }

    // Process multi-item array batch through database layer transaction
    const data = await createManualTransactionDomain({
      userId: user_id ? Number(user_id) : null,
      items, // Format: Array of { product_id, quantity, price_at_purchase }
      method: method ?? "cash",
      referenceNo: reference_no || null,
      notes: notes || null,
    });

    // Notify administrators across active terminal dashboard screens
    broadcastNotification("MANUAL_TRANSACTION_LOGGED", {
      userId: user_id || null,
      member: data.member_name,
      amount: data.total_amount,
      item: data.summary_item_name,
    });

    res.status(201).json({
      success: true,
      message:
        "POS Transaction completed and stock counts updated successfully.",
      data,
    });
  },
);

export const requestPurchase = catchAsync(
  async (req: Request, res: Response) => {
    const { planId, planName, method } = req.body;
    const userId = req.user?.id;
    const file = req.file as any;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await createPaymentDomain(
      userId,
      planId ? Number(planId) : undefined,
      planName ? String(planName) : undefined,
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
      message: "Payment submitted for verification successfully.",
      data,
    });
  },
);


export const updateReceiptProof = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const { receiptUrl } = req.body; // Sent from purchaseService.uploadReceiptProof
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!receiptUrl) {
      return res.status(400).json({
        success: false,
        message: "Receipt image URL reference is required.",
      });
    }

    // Run database mutation domain
    const data = await updateReceiptProofDomain(
      Number(paymentId),
      Number(userId),
      receiptUrl
    );

    broadcastNotification("PAYMENT_PROOF_SUBMITTED", {
      paymentId: data.id,
      member: data.member_name,
      amount: data.amount,
      type: data.transaction_type,
    });

    res.status(200).json({
      success: true,
      message: "Payment receipt uploaded successfully. Awaiting administrator approval.",
      data,
    });
  },
);

export const verifyPurchase = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const adminId = Number(req.user?.id);

    const data = await verifyPaymentDomain(Number(paymentId), adminId);

    broadcastNotification("PAYMENT_VERIFIED", {
      userId: data.user_id,
      status: "paid",
      item: data.summary_item_name, // Matches the dynamic value returned from our domain refactor
    });

    res.status(200).json({
      success: true,
      message:
        "Payment verified, active membership access or product inventory logs updated.",
      data,
    });
  },
);

export const denyPurchase = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.params;

  const adminId = Number(req.user?.id);

  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const data = await denyPaymentDomain(Number(paymentId), adminId);

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

    const data = await deletePaymentDomain(Number(paymentId));

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
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;
    const { userId } = req.query;

    const targetUserId = requesterRole === "member"
      ? Number(requesterId)
      : (userId ? Number(userId) : undefined);

    const transactions = await getTransactionsDomain(targetUserId);

    res.status(200).json({
      success: true,
      results: transactions.length,
      data: transactions,
    });
  },
);