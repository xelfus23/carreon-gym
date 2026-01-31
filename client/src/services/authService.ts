const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const authService = {
    register: async (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        contactNumber: string,
    ) => {
        const result = await fetch(`${API_URL}/api/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                password,
                contactNumber,
            }),
        });

        return await result.json();
    },
    login: async (email: string, password: string) => {
        const result = await fetch(`${API_URL}/api/authenticate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        return await result.json();
    },
    logout: async () => {},
};
