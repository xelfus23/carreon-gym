import { authStorage } from "./authStorage";
import { tokenManager } from "./tokenManager";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

let isRefreshing = false;
let subscribers: ((token: string) => void)[] = [];
let rejectSubscribers: ((err: Error) => void)[] = [];

function notifySubscribers(token: string) {
    subscribers.forEach((cb) => cb(token));
    subscribers = [];
    rejectSubscribers = [];
}

function rejectAllSubscribers(err: Error) {
    rejectSubscribers.forEach((cb) => cb(err));
    subscribers = [];
    rejectSubscribers = [];
}

async function refreshAccessToken() {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) throw new Error("Session expired. Please log in again.");

    const res = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) throw new Error("Session expired. Please log in again.");

    const json = await res.json();
    const { accessToken, refreshToken: newRefresh, user } = json.data;

    tokenManager.set(accessToken, newRefresh);

    if (user) {
        await authStorage.save(user, accessToken, newRefresh);
    } else {
        await authStorage.saveTokens(accessToken, newRefresh);
    }

    return accessToken;
}

async function parseAndThrowIfError(res: Response) {
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json?.message ?? `Request failed: ${res.status}`);
    }
    return json;
}

export async function request(path: string, options: RequestInit = {}) {
    const makeRequest = (token: string | null) =>
        fetch(`${API_URL}/api${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });

    let res = await makeRequest(tokenManager.getAccessToken());

    if (res.status !== 401) {
        return parseAndThrowIfError(res);
    }

    return new Promise((resolve, reject) => {
        subscribers.push(async (token) => {
            try {
                const retry = await makeRequest(token);
                resolve(await parseAndThrowIfError(retry));
            } catch (e) {
                reject(e);
            }
        });
        rejectSubscribers.push(reject);

        if (!isRefreshing) {
            isRefreshing = true;
            refreshAccessToken()
                .then((newToken) => {
                    notifySubscribers(newToken);
                })
                .catch((err) => {
                    rejectAllSubscribers(
                        err instanceof Error
                            ? err
                            : new Error("Token refresh failed"),
                    );
                })
                .finally(() => {
                    isRefreshing = false;
                });
        }
    });
}
