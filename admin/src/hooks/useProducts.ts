import { useCallback, useEffect, useState } from "react";
import { productService } from "../services/product.service";
import type { ProductProps } from "../types";



export const useProducts = () => {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await productService.getProduct();
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

  const createProduct = async (product: ProductProps) => {
    try {
      const data = await productService.createProduct(product);

      if (data.success) {
        getProducts();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch products";

      setError(message);
    }
  };

  const updateProduct = async (
    productId: number,
    updates: Partial<ProductProps>,
  ) => {
    try {
      await productService.updateProduct(productId, updates);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch products";

      setError(message);
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      await productService.deleteProduct(productId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch products";

      setError(message);
    }
  };

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  return {
    products,
    isLoading,
    error,
    refresh: getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
