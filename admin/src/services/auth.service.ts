const API_URL = import.meta.env.VITE_BASE_URL;

let isRefreshing = false;
type PendingResolver = {
    resolve: () => void;
    reject: (err: Error) => void;
};
let pendingRequests: PendingResolver[] = [];

function resolvePending() {
    pendingRequests.forEach((p) => p.resolve());
    pendingRequests = [];
}

function rejectPending(err: Error) {
    pendingRequests.forEach((p) => p.reject(err));
    pendingRequests = [];
}

export class SessionExpiredError extends Error {
    constructor() {
        super("Session expired. Please log in again.");
        this.name = "SessionExpiredError";
    }
}

async function shouldAttemptRefresh(res: Response): Promise<boolean> {
    if (res.status === 401) return true;
    if (res.status !== 400) return false;

    try {
        const payload = await res.clone().json();
        return (
            payload?.code === "MISSING_ACCESS_TOKEN" ||
            payload?.message === "No access token provided"
        );
    } catch {
        return false;
    }
}

async function fetchWithRefresh(
    input: RequestInfo,
    init: RequestInit = {},
): Promise<Response> {
    const defaults: RequestInit = {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...init.headers },
    };

    const res = await fetch(input, { ...defaults, ...init });

    if (!(await shouldAttemptRefresh(res))) return res;

    if (isRefreshing) {
        await new Promise<void>((resolve, reject) => {
            pendingRequests.push({ resolve, reject });
        });

        return fetch(input, { ...defaults, ...init });
    }

    isRefreshing = true;

    try {
        const refreshRes = await fetch(`${API_URL}/api/auth/web/refresh`, {
            method: "POST",
            credentials: "include",
        });

        if (!refreshRes.ok) {
            throw new SessionExpiredError();
        }

        resolvePending();

        return fetch(input, { ...defaults, ...init });
    } catch (err) {
        const error =
            err instanceof SessionExpiredError
                ? err
                : new SessionExpiredError();
        rejectPending(error);
        throw error;
    } finally {
        isRefreshing = false;
    }
}

export const authService = {
    async login(email: string, password: string) {
        const res = await fetch(`${API_URL}/api/auth/web`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || "Login failed");
        }

        return data;
    },

    async me(): Promise<{
        success: boolean;
        status?: number;
        data?: { user: AuthUser };
    }> {
        try {
            const res = await fetchWithRefresh(`${API_URL}/api/users/web/me`);

            if (!res.ok) {
                return { success: false, status: res.status };
            }

            const data = await res.json();

            if (!data.success) {
                return { success: false, status: res.status };
            }

            return data;
        } catch (err) {
            if (err instanceof SessionExpiredError) {
                throw err;
            }
            return { success: false };
        }
    },

    async logout() {
        try {
            const res = await fetch(`${API_URL}/api/auth/web/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            return res.json();
        } catch (error) {
            console.error("Logout error:", error);
        }
    },

    async refreshToken() {
        const res = await fetch(`${API_URL}/api/auth/web/refresh`, {
            method: "POST",
            credentials: "include",
        });

        if (!res.ok) {
            throw new SessionExpiredError();
        }

        return res.json();
    },

    fetchWithRefresh,
};

interface AuthUser {
    id: string | number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}
