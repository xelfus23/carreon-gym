import { useCallback, useEffect, useState } from "react";
import { productService } from "../services/product.service";
import { ProductProps } from "../types/Product";

export const useProducts = () => {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productService.getProduct();
      setProducts(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch products";
      setError(message);
      console.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  return {
    products,
    isLoading,
    error,
    refresh: getProducts,
  };
};
