import { authStorage } from "./authStorage";
import { tokenManager } from "./tokenManager";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const REQUEST_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS) || 10000;

type RequestOptions = RequestInit & {
  skipAuthRefresh?: boolean;
  skipAuthHeader?: boolean;
};

// Core Variables
let isRefreshing = false; // refreshing state
let subscribers: ((token: string) => void)[] = []; // token array
let rejectSubscribers: ((err: Error) => void)[] = []; //

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

  const res = await fetchWithTimeout(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-platform": "mobile",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error("Session expired. Please log in again.");

  const json = await res.json();

  const { accessToken, refreshToken: newRefresh, user } = json.data;

  tokenManager.set(accessToken, newRefresh);

  if (user) {
    await authStorage.save(user, accessToken, newRefresh); //
  } else {
    await authStorage.saveTokens(accessToken, newRefresh);
  }

  return accessToken;
}

async function parseAndThrowIfError(res: Response) {
  const json = await res.json(); // the response json

  if (!res.ok) {
    throw new Error(json?.message ?? `Request failed: ${res.status}`);
  }

  return json; // if response is ok then return the data
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function request(path: string, options: RequestOptions = {}) {
  // A request function
  const { skipAuthRefresh = false, skipAuthHeader = false, ...fetchOptions } =
    options;

  const makeRequest = (token: string | null) =>
    fetchWithTimeout(`${API_URL}/api${path}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(!skipAuthHeader && token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...fetchOptions.headers,
      },
    });

  let res = await makeRequest(tokenManager.getAccessToken()); // call the makeRequest function and pass the AccessToken

  if (res.status !== 401 || skipAuthRefresh) {
    return parseAndThrowIfError(res); // if the status is not an error validate.
  }

  // if the status is 401 - Unauthorized, get a new token.
  return new Promise((resolve, reject) => {
    subscribers.push(async (token) => {
      try {
        const retry = await makeRequest(token); // retry refresh with the new token
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

/**
 * Manually trigger a token refresh using the same logic as HTTP requests.
 * Useful for WebSockets or other non-fetch based requests.
 */

export async function forceRefreshToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      subscribers.push(resolve);
      rejectSubscribers.push(reject);
    });
  }

  isRefreshing = true;
  try {
    const newToken = await refreshAccessToken();
    notifySubscribers(newToken);
    return newToken;
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Token refresh failed");
    rejectAllSubscribers(error);
    throw error;
  } finally {
    isRefreshing = false;
  }
}
