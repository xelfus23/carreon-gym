import { API_URL } from "../constants";
import { authService } from "../services/auth.service";

export type ImageUploadType = "product" | "subscription" | "equipments" | "profile"

export const uploadImage = async (imageFile: File, type: ImageUploadType) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const result = await authService.fetchWithRefresh(
    `${API_URL}/api/image-upload`,
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