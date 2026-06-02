import pool from "../../config/pool.ts";
import type { ProductProps } from "../../types/index.ts";

// --- CREATE ---
export const createProductDomain = async (params: ProductProps) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get Category ID from Name
    const catRes = await client.query(
      "SELECT id FROM product_categories WHERE name = $1",
      [params.category],
    );
    if (catRes.rows.length === 0)
      throw new Error(`Category ${params.category} not found`);

    // 2. Determine Status Logic
    const status =
      params.stocks <= 0
        ? "out_of_stock"
        : params.is_active === false
          ? "unavailable"
          : "available";

    const productRes = await client.query(
      `INSERT INTO products (name, image_urls, category_id, price, stocks, status, is_active, last_restock_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING id, name, image_urls, price, stocks, status`,
      [
        params.product_name,
        params.image_urls ?? [],
        catRes.rows[0].id,
        params.price,
        params.stocks,
        status,
        params.is_active ?? true,
        params.last_restock || new Date(),
      ],
    );

    await client.query("COMMIT");
    return productRes.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

