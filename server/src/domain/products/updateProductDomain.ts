import pool from "../../config/pool.ts";
import type { ProductProps } from "../../types/index.ts";

export const updateProductDomain = async (
    id: string,
    params: Partial<ProductProps>,
) => {
    const updates: string[] = [];
    const values: any[] = [];
    let count = 1;

    // Build Dynamic Query
    if (params.product_name) {
        updates.push(`name = $${count++}`);
        values.push(params.product_name);
    }
    if (params.price !== undefined) {
        updates.push(`price = $${count++}`);
        values.push(params.price);
    }
    if (params.stocks !== undefined) {
        updates.push(`stocks = $${count++}`);
        values.push(params.stocks);
        // Automatically update status based on stock count
        const status = params.stocks <= 0 ? "out_of_stock" : "available";
        updates.push(`status = $${count++}`);
        values.push(status);
    }
    if (params.is_active !== undefined) {
        updates.push(`is_active = $${count++}`);
        values.push(params.is_active);
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
