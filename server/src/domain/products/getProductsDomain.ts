import pool from "../../config/pool.ts";

export const getProductsDomain = async (id?: number) => {
  const baseQuery = `
    SELECT
      p.id,
      p.name AS product_name,
      p.image_urls,
      p.price,
      p.last_restock_at AS last_restock,
      p.is_active AS available,
      p.stocks,
      p.status,
      c.name AS category,
      p.category_id,
      p.is_active,
      p.created_at,
      p.updated_at
    FROM products p
    INNER JOIN product_categories c ON c.id = p.category_id
  `;
  if (id) {
    const res = await pool.query(`${baseQuery} WHERE p.id = $1`, [id]);
    return res.rows[0];
  }
  const res = await pool.query(`${baseQuery} ORDER BY product_name ASC`);
  return res.rows;
};

