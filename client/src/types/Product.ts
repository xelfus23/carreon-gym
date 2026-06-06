export type ProductProps = {
  id: number;
  product_name: string;
  icon_url: string;
  price: number;
  last_restock: string;
  available: boolean;
  stocks: number;
  status: "available" | "out_of_stock" | "unavailable";
  category: string;
  is_active?: boolean;
};