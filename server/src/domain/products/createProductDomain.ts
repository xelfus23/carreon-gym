import pool from "../../config/pool.ts";
import type { ProductProps } from "../../types/index.ts";

export const createProductDomain = async (params: ProductProps) => {
  const status =
    params.stocks <= 0
      ? "out_of_stock"
      : params.is_active === false
        ? "unavailable"
        : "available";

  const payload: Record<string, any> = {
    name: params.product_name,
    icon_url: params.icon_url,
    price: params.price,
    stocks: params.stocks,
    status: status,
    is_active: params.is_active ?? true,
    last_restock_at: params.last_restock || new Date(),
  };

  const columns = Object.keys(payload);
  const values = Object.values(payload);

  const placeholders = columns.map((_, idx) => `$${idx + 1}`);

  columns.push("category_id");
  placeholders.push(`(SELECT id FROM product_categories WHERE name = $${columns.length})`);
  values.push(params.category);

  const queryText = `
    INSERT INTO products (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING id, name, icon_url, price, stocks, status;
  `;

  const productRes = await pool.query(queryText, values);

  return productRes.rows[0];
};