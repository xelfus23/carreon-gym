import pool from "../../config/pool.ts";
import type { ProductProps } from "../../types/index.ts";

export const updateProductDomain = async (
  id: number,
  params: Partial<ProductProps>,
) => {

  const currentProductRes = await pool.query(
    `SELECT stocks, is_active FROM products WHERE id = $1`,
    [id]
  );

  if (currentProductRes.rowCount === 0) {
    throw new Error("Product not found");
  }

  const currentProduct = currentProductRes.rows[0];

  const updates: string[] = [];
  const values: any[] = [];

  let nextStocks: number = currentProduct.stocks;
  let nextIsActive: boolean = currentProduct.is_active;
  let stockIncreased = false;

  if (params.product_name) {
    values.push(params.product_name);
    updates.push(`name = $${values.length}`);
  }

  if (params.image_urls !== undefined) {
    values.push(params.image_urls);
    updates.push(`image_urls = $${values.length}`);
  }

  if (params.price !== undefined) {
    values.push(params.price);
    updates.push(`price = $${values.length}`);
  }

  if (params.stocks !== undefined) {
    values.push(params.stocks);
    updates.push(`stocks = $${values.length}`);

    if (params.stocks > currentProduct.stocks) {
      stockIncreased = true;
    }
    nextStocks = params.stocks;
  }
  if (params.is_active !== undefined) {
    values.push(params.is_active);
    updates.push(`is_active = $${values.length}`);
    nextIsActive = params.is_active;
  }

  if (stockIncreased) {
    updates.push(`last_restock_at = CURRENT_TIMESTAMP`);
  }

  const status = nextIsActive === false ? "unavailable" : nextStocks <= 0 ? "out_of_stock" : "available";
  values.push(status);
  updates.push(`status = $${values.length}`);

  if (updates.length === 1) return { message: "No changes made" };

  values.push(id);

  const res = await pool.query(
    `UPDATE products 
     SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${values.length} 
     RETURNING *`,
    values,
  );

  return res.rows[0];
};