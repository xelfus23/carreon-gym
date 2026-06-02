import { API_URL } from "../constants";
import type { ProductProps } from "../types";
import { authService } from "./auth.service";

export const productService = {
  uploadProductImage: async (imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/products/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await result.json();
    return data as { success: boolean; data?: { url: string } };
  },

  getProduct: async () => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/products`,
    );

    const data = await result.json();

    return data;
  },

  createProduct: async (product: ProductProps) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/products`,
      {
        method: "POST",
        body: JSON.stringify(product),
      },
    );

    const data = await result.json();

    return data;
  },

  updateProduct: async (id: number, updates: Partial<ProductProps>) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/products/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
    );

    const data = await result.json();

    return data;
  },

  deleteProduct: async (id: number) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/products/${id}`,
      {
        method: "DELETE",
      },
    );

    const data = result.json();
    return data;
  },
};
