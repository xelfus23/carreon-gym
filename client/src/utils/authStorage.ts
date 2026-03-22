import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser } from "../types/users";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "@auth_user";

export const authStorage = {
    async save(user: AuthUser, accessToken: string, refreshToken: string) {
 
        // save the user, accessToken, refreshToken into expo SecureStore
        await Promise.all([
            SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
            SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
            AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
        ]);
    },

    async saveTokens(accessToken: string, refreshToken: string) {


        // save accessToken and refreshToken
        await Promise.all([
            SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
            SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
        ]);
    },

    async load() {

        // load tokens and user
        const [accessToken, refreshToken, userStr] = await Promise.all([
            SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
            SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
            AsyncStorage.getItem(USER_KEY),
        ]);

        return {
            user: userStr ? (JSON.parse(userStr) as AuthUser) : null,
            accessToken,
            refreshToken,
        };
    },

    async clear() {
        // clear user and tokens.
        await Promise.all([
            SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
            SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
            AsyncStorage.removeItem(USER_KEY),
        ]);
    },
};
