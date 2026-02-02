import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser } from "../types/users";

const USER_KEY = "@auth_user";
const TOKEN_KEY = "auth_token";

export const authStorage = {
    async save(user: AuthUser, token: string) {
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch (err) {
            console.error("Error saving auth data:", err);
        }
    },

    // Load user and token
    async load(): Promise<{ user: AuthUser | null; token: string | null }> {
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            const userStr = await AsyncStorage.getItem(USER_KEY);
            const user = userStr ? JSON.parse(userStr) : null;

            return { user, token };
        } catch (err) {
            console.error("Error loading auth data:", err);
            return { user: null, token: null };
        }
    },

    // Clear user and token
    async clear() {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
        } catch (err) {
            console.error("Error clearing auth data:", err);
        }
    },
};
