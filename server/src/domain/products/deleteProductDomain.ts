import pool from "../../config/pool.ts";

// --- DELETE ---
export const deleteProductDomain = async (id: string) => {
    const res = await pool.query(
        "DELETE FROM products WHERE id = $1 RETURNING id",
        [id],
    );
    if (res.rowCount === 0) throw new Error("Product not found");
    return { success: true };
};
