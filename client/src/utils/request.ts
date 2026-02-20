import { authService } from "../services/authService";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

type ResponseType = {
    success: boolean;
    message: string;
    data: any | undefined;
};

export async function request(url: string, options: RequestInit = {}) {
    const res = await authService.fetchWithAuth(
        `${API_URL}/api${url}`,
        options,
    );
    const data: ResponseType = await res.json();

    if (!data.success) throw new Error(data.message);

    return data;
}

