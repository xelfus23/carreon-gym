import pool from "../../config/pool.ts";

// in paymentDomain.ts
export const sellProductDomain = async (
  userId: number,
  productId: number,
  adminId: number,
  method: any,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get product price and check stock
    const prodRes = await client.query(
      "SELECT price, stocks, name FROM products WHERE id = $1",
      [productId],
    );
    const product = prodRes.rows[0];

    if (product.stocks <= 0)
      throw new Error(`${product.name} is out of stock!`);

    // 2. Decrease stock
    await client.query(
      "UPDATE products SET stocks = stocks - 1 WHERE id = $1",
      [productId],
    );

    // 3. Record the payment
    const paymentRes = await client.query(
      `INSERT INTO payments (user_id, product_id, amount, transaction_type, method, recorded_by, status)
           VALUES ($1, $2, $3, 'product', $4, $5, 'paid') RETURNING *`,
      [userId, productId, product.price, method, adminId],
    );

    await client.query("COMMIT");
    return paymentRes.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
