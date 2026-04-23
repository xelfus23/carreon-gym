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

  verifyMember: async (memberId: number) => {
    const result = await authService.fetchWithRefresh(
      `${API_URL}/api/members/verify/${memberId}`,
      {
        method: "PATCH",
      },
    );

    const data = await result.json();

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
