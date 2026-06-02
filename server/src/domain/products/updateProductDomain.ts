import pool from "../../config/pool.ts";
import type { ProductProps } from "../../types/index.ts";

export const updateProductDomain = async (
    id: string,
    params: Partial<ProductProps>,
) => {
    const updates: string[] = [];
    const values: any[] = [];
    let count = 1;

    let nextStocks: number | undefined = undefined;
    let nextIsActive: boolean | undefined = undefined;

    // Build Dynamic Query
    if (params.product_name) {
        updates.push(`name = $${count++}`);
        values.push(params.product_name);
    }
    if (params.image_urls !== undefined) {
        updates.push(`image_urls = $${count++}`);
        values.push(params.image_urls);
    }
    if (params.price !== undefined) {
        updates.push(`price = $${count++}`);
        values.push(params.price);
    }
    if (params.stocks !== undefined) {
        updates.push(`stocks = $${count++}`);
        values.push(params.stocks);
        nextStocks = params.stocks;
    }
    if (params.is_active !== undefined) {
        updates.push(`is_active = $${count++}`);
        values.push(params.is_active);
        nextIsActive = params.is_active;
    }

    // Automatically update status based on stock + is_active (prefer explicit updates if provided)
    if (nextStocks !== undefined || nextIsActive !== undefined) {
        const active = nextIsActive ?? true;
        const stocks = nextStocks ?? 1;
        const status = active === false ? "unavailable" : stocks <= 0 ? "out_of_stock" : "available";
        updates.push(`status = $${count++}`);
        values.push(status);
    }

    if (updates.length === 0) return { message: "No changes made" };

    values.push(id);
    const res = await pool.query(
        `UPDATE products SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${count} RETURNING *`,
        values,
    );

    if (res.rowCount === 0) throw new Error("Product not found");
    return res.rows[0];
};
