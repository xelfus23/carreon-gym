import { authStorage } from "../utils/authStorage";
import { request } from "../utils/request";
import { tokenManager } from "../utils/tokenManager";

type registrationProps = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    contactNumber: string;
};

export const authService = {
    async login(email: string, password: string) {
        const { data } = await request("/auth/mobile", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        tokenManager.set(data?.accessToken ?? null, data?.refreshToken ?? null);

        await authStorage.save(
            data?.user ?? null,
            data?.accessToken ?? null,
            data?.refreshToken ?? null,
        );

        return data;
    },

    async register({
        firstName,
        lastName,
        email,
        password,
        contactNumber,
    }: registrationProps) {
        const res = await request("/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                password,
                phoneNumber: contactNumber,
            }),
        });

        const { user, accessToken, refreshToken } = res.data;

        tokenManager.set(accessToken, refreshToken);
        await authStorage.save(user, accessToken, refreshToken);

        return { user };
    },

    async logout(refreshToken: string) {
        await request(`/auth/mobile/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        tokenManager.clear();
        await authStorage.clear();
    },

    async me() {
        return (await request(`/users/mobile/me`)).data;
    },

    async updateUser(
        userId: string | number,
        updates: Partial<{
            firstName: string;
            lastName: string;
            email: string;
            contactNumber: string;
        }>,
    ) {
        return (
            await request(`/users/${userId}`, {
                method: "PATCH",
                body: JSON.stringify(updates),
            })
        ).data;
    },

    async updateProfile(
        userId: string | number,
        profileUpdates: Partial<{
            heightCm: number;
            gender: string;
            birthDate: string;
            goal: string;
            activityLevel: string;
        }>,
    ) {
        return (
            await request(`/user-profiles/${userId}`, {
                method: "PATCH",
                body: JSON.stringify(profileUpdates),
            })
        ).data;
    },
};
