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

  const createProduct = async (product: Partial<ProductProps>, imageFile: File | null) => {
    try {
      let image_urls = product.image_urls ?? [];

      if (imageFile) {
        const upload = await productService.uploadProductImage(imageFile);
        if (upload?.success && upload.data?.url) image_urls = [upload.data.url];
      }

      const is_active = product.status === "unavailable" ? false : product.is_active ?? true;

      const data = await productService.createProduct({
        ...(product as ProductProps),
        image_urls,
        is_active,
      });

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
    imageFile: File | null,
  ) => {
    try {
      const patch: Partial<ProductProps> = { ...updates };

      if (imageFile) {
        const upload = await productService.uploadProductImage(imageFile);
        if (upload?.success && upload.data?.url) {
          patch.image_urls = [upload.data.url];
        }
      }

      if (patch.status === "unavailable") patch.is_active = false;
      if (patch.status === "available" || patch.status === "out_of_stock")
        patch.is_active = true;

      await productService.updateProduct(productId, patch);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch products";
      setError(message);
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      await productService.deleteProduct(productId);
      getProducts()
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
