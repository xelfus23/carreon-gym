import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser } from "../types/users";

const USER_KEY = "@auth_user";
const TOKEN_KEY = "@auth_token";

export const authStorage = {
    async save(user: AuthUser, token: string) {
        await AsyncStorage.multiSet([
            [USER_KEY, JSON.stringify(user)],
            [TOKEN_KEY, token],
        ]);
    },

    async load() {
        const [[, user], [, token]] = await AsyncStorage.multiGet([
            USER_KEY,
            TOKEN_KEY,
        ]);

        return {
            user: user ? JSON.parse(user) : null,
            token,
        };
    },

    async clear() {
        await AsyncStorage.multiRemove([USER_KEY, TOKEN_KEY]);
    },
};
