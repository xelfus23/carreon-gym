import { API_URL } from "../constants";
import { authService } from "../services/auth.service";

export type ImageUploadType = "products" | "subscriptions" | "equipments" | "profiles" | "payments"

export const uploadImage = async (imageFile: File, type: ImageUploadType) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const result = await authService.fetchWithRefresh(
    `${API_URL}/api/image-uploads `,
    {
      method: "POST",
      headers: {
        "x-upload-type": type,
      },
      body: formData,
    },
  );

  const data = await result.json();

  return data as { success: boolean; data?: { url: string } };
}