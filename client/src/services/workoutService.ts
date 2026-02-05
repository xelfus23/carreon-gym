import { authService } from "./authService";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const workoutService = {
    getWorkout: async () => {
        const response = await fetch(`${API_URL}/api/workoutplan`, {
            method: "GET",
            headers: authService.getHeaders(),
        });

        return await response.json();
    },
    deleteWorkout: async () => {},
};
