let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenManager = {
    set(access: string | null, refresh?: string | null) {
        accessToken = access;
        if (refresh !== undefined) refreshToken = refresh;
    },

    getAccessToken() {
        return accessToken;
    },

    getRefreshToken() {
        return refreshToken;
    },

    clear() {
        accessToken = null;
        refreshToken = null;
    },
};
