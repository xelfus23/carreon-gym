-- One-time: create product list view used by GET /api/products (getProductsDomain).

CREATE OR REPLACE VIEW v_product_inventory AS
SELECT
    p.id,
    p.name AS product_name,
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
INNER JOIN product_categories c ON c.id = p.category_id;
