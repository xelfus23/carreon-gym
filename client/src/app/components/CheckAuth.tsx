import { Redirect } from "expo-router";
import { useAuth } from "@/src/context/authContext";

export default function CheckAuth() {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Redirect href={'/(drawer)/(home)/dashboard'} />;
    }

    return <Redirect href="/login" />;
}
