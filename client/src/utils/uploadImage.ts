import { tokenManager } from "./tokenManager";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const uploadImage = async (uri: string, type: string) => {
  const accessToken = tokenManager.getAccessToken();
  if (!accessToken) throw new Error("Please login first.");

  const formData = new FormData();
  const fileName = uri.split("/").pop() ?? "receipt.jpg";

  formData.append("image", {
    uri,
    name: fileName,
    type: "image/jpeg",
  } as any);

  const res = await fetch(`${API_URL}/api/image-uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-upload-type": type,
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message ?? "Failed to upload image asset.");
  }
  return data as { success: boolean; data?: { url: string } };
};
