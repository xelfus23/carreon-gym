import { API_URL } from "../constants";
import { authService } from "./auth.service";

export const memberService = {
  getMember: async () => {
    const result = await authService.fetchWithRefresh(`${API_URL}/api/members`);

    const data = await result.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    return data;
  },

  getAttendance: async () => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/attendance/log`,
    );

    const data = await result.json();

    return data;
  },

  verifyAccount: async (accountId: number) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/members/verify/${accountId}`,
      {
        method: "PATCH",
      },
    );

    const data = await result.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to verify member");
    }

    return data;
  },

  deleteAccount: async (accountId: number) => {
    const result = await authService.fetchWithRefresh(`${API_URL}/api/members/delete/${accountId}`, {
      method: "DELETE",
    })

    const data = await result.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to delete account");
    }

    return data
  },

  banAccount: async (accountId: number) => {
    const result = await authService.fetchWithRefresh(`${API_URL}/api/members/ban/${accountId}`, {
      method: "PATCH"
    })

    const data = await result.json()

    if (!data.success) {
      throw new Error(data.message || "Failed to ban Account")
    }

    return data
  },

  suspendAccount: async (accountId: number) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/members/suspend/${accountId}`,
      {
        method: "PATCH",
      },
    );

    const data = await result.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to update suspend status");
    }

    return data;
  },

  createMember: async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }) => {
    const result = await authService.fetchWithRefresh(`${API_URL}/api/users/register`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await result.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to create member");
    }
    return data;
  },

  manualAttendance: async (payload: {
    userId: number;
    action: "check_in" | "check_out";
  }) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/attendance/manual`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    const data = await result.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to log attendance");
    }
    return data;
  },
};
