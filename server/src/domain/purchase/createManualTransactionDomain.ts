import pool from "../../config/pool.ts";
import { generateReferenceNo } from "../../utils/generateReferenceNo.ts";

interface CartItemInput {
  product_id: number;
  quantity: number;
  price_at_purchase: number;
}

// 2. Ensure items is typed as CartItemInput[]
interface ManualTransactionArgs {
  userId: number | null;
  items: CartItemInput[]; // 👈 Check this line carefully
  method: string;
  referenceNo: string | null;
  notes: string | null;
}

export const createManualTransactionDomain = async ({
  userId,
  items,
  method,
  referenceNo,
  notes,
}: ManualTransactionArgs) => {
  // Acquire an isolated client from the pool to safely lock transaction sequence
  const client = await pool.connect();

  try {
    // Start database TRANSACTION isolation block
    await client.query("BEGIN");

    // 1. Calculate running sum of entire cart items mix array payload
    const overallTotalAmount = items.reduce((sum, item) => {
      return sum + Number(item.price_at_purchase) * Number(item.quantity);
    }, 0);

    const finalReferenceNo = generateReferenceNo("walk_in_pos", referenceNo);

    // 2. Insert the singular financial record summary header row
    const masterPaymentRes = await client.query(
      `INSERT INTO payments (
        user_id,
        subscription_id,
        plan_id,
        transaction_type,
        origin,
        amount,
        status,
        method,
        reference_no,
        notes,
        paid_at
      ) 
      VALUES ($1, NULL, NULL, 'product', 'walk_in_pos', $2, 'paid', $3, $4, $5, NOW())
      RETURNING id, reference_no, amount`,
      [userId, overallTotalAmount, method, finalReferenceNo, notes],
    );

    const newPaymentId = masterPaymentRes.rows[0].id;
    const finalInsertedItems = [];

    // 3. Loop cart objects items array array to feed child rows rows
    for (const item of items) {
      const itemRes = await client.query(
        `INSERT INTO payment_items (
          payment_id,
          product_id,
          quantity,
          price_at_purchase
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [newPaymentId, item.product_id, item.quantity, item.price_at_purchase],
      );

      // Decrement the active warehouse inventory tracker metrics column for the item
      await client.query(
        `UPDATE products 
         SET stocks = stocks - $1 
         WHERE id = $2`,
        [item.quantity, item.product_id],
      );

      finalInsertedItems.push(itemRes.rows[0]);
    }

    // Resolve human readable username details for the frontend notification payload
    let memberName = "Walk-in / Guest Client";

    if (userId) {
      const userLookUp = await client.query(
        `SELECT first_name || ' ' || last_name as full_name FROM users WHERE id = $1`,
        [userId],
      );
      if (userLookUp.rows.length) memberName = userLookUp.rows[0].full_name;
    }

    // Resolve first product name to generate string descriptors summary labels
    const primaryProductLookUp = await client.query(
      `SELECT name FROM products WHERE id = $1`,
      [items[0]?.product_id],
    );

    const primaryProductName =
      primaryProductLookUp.rows[0]?.name || "Product Item";
    const distinctItemsCount = items.length;

    // Commit changes to permanent row sectors safely if all checks validate
    await client.query("COMMIT");

    return {
      payment_id: newPaymentId,
      reference_no: finalReferenceNo,
      member_name: memberName,
      total_amount: overallTotalAmount,
      summary_item_name:
        distinctItemsCount > 1
          ? `${primaryProductName} (+${distinctItemsCount - 1} other items)`
          : primaryProductName,
      manifest: finalInsertedItems,
    };
  } catch (error) {
    // Safe failure management: revert schema inputs if validation throws exceptions
    await client.query("ROLLBACK");
    console.error("❌ Critical POS System Transaction Rolling Back:", error);
    throw error;
  } finally {
    // Return connection resource lease pools back safely
    client.release();
  }
};
