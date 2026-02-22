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

    if (!res) throw new Error("Session expired. Please log in again.");

    const contentType = res.headers.get("content-type");
    const isJson =
        contentType?.includes("application/json") ?? false;

    const text = await res.text();

    if (!isJson) {
        if (!res.ok) {
            throw new Error(
                text?.slice(0, 100) ||
                    `Request failed with status ${res.status}`,
            );
        }
        throw new Error("Server returned an invalid response (not JSON).");
    }

    let data: ResponseType;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Server returned an invalid response (not JSON).");
    }

    if (!data.success) throw new Error(data.message ?? "Request failed");
    return data;
}
