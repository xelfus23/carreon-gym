import pool from "../../config/pool.ts";

export const createPendingPurchaseDomain = async (
    userId: number,
    productId: number,
    qty: number,
    method: string,
) => {
    const res = await pool.query(
        `INSERT INTO payments (user_id, product_id, quantity, amount, transaction_type, method, status)
       SELECT $1, $2, $3, (price * $3), 'product', $4, 'pending'
       FROM products WHERE id = $2
       RETURNING *`,
        [userId, productId, qty, method],
    );
    return res.rows[0];
};

export const verifyProductPurchaseDomain = async (
    paymentId: number,
    adminId: number,
) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Get transaction details
        const payRes = await client.query(
            "SELECT * FROM payments WHERE id = $1 AND status = 'pending'",
            [paymentId],
        );
        if (payRes.rowCount === 0)
            throw new Error("Pending transaction not found");
        const payment = payRes.rows[0];

        // 2. Check and Update Stock
        const stockRes = await client.query(
            "UPDATE products SET stocks = stocks - $1 WHERE id = $2 AND stocks >= $1 RETURNING name",
            [payment.quantity, payment.product_id],
        );
        if (stockRes.rowCount === 0)
            throw new Error("Insufficient stock to complete purchase");

        // 3. Set Payment to Paid
        const updatedPayment = await client.query(
            `UPDATE payments 
           SET status = 'paid', recorded_by = $2, paid_at = CURRENT_TIMESTAMP 
           WHERE id = $1 RETURNING *`,
            [paymentId, adminId],
        );

        await client.query("COMMIT");
        return updatedPayment.rows[0];
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};
