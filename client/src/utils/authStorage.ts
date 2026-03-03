//MOBILE
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser } from "../types/users";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "@auth_user";

export const authStorage = {
    async save(user: AuthUser, accessToken: string, refreshToken: string) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    async load() {
        const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        const userStr = await AsyncStorage.getItem(USER_KEY);
        const user = userStr ? JSON.parse(userStr) : null;
        return { user, accessToken, refreshToken };
    },

    async clear() {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
    },
};
