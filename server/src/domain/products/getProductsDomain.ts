import pool from "../../config/pool.ts";

export const getProductsDomain = async (id?: string) => {
  if (id) {
      const res = await pool.query(
          "SELECT * FROM v_product_inventory WHERE id = $1",
          [id],
      );
      return res.rows[0];
  }
  const res = await pool.query(
      "SELECT * FROM v_product_inventory ORDER BY product_name ASC",
  );
  return res.rows;
};

