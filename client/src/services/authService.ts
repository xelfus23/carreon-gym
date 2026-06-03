import { CurrentStats, Profile } from "../types/users";
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
    const { data } = await request("/auth", {
      method: "POST",
      body: JSON.stringify({ email, password, platform: "mobile" }),
      skipAuthRefresh: true,
      skipAuthHeader: true,
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
      skipAuthRefresh: true,
      skipAuthHeader: true,
    });

    const { user, accessToken, refreshToken } = res.data;

    tokenManager.set(accessToken, refreshToken);
    await authStorage.save(user, accessToken, refreshToken);

    return { user };
  },

  async logout(refreshToken: string) {
    // logout connection to backend.
    await request(`/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    // clear existing tokens
    tokenManager.clear();
    await authStorage.clear();
  },

  async me() {
    return (await request(`/users/me`)).data; // get the user data from the backend.
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
    profileUpdates: Partial<Profile>,
  ) {
    return (
      await request(`/users/profiles`, {
        method: "PATCH",
        body: JSON.stringify(profileUpdates),
      })
    ).data;
  },

  async updateStats(
    userId: string | number,
    statsUpdate: Partial<CurrentStats>,
  ) {
    return (
      await request(`/users/stats`, {
        method: "PATCH",
        body: JSON.stringify(statsUpdate),
      })
    ).data;
  },
};
