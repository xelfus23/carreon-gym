import { useCallback, useEffect, useState } from "react";
import { gymDetailService } from "../services/gymDetails.service";

export type gymDetailsType = {
    id: number;
    gym_name: string;
    address: string;
    contact_number: string;
    email: string;
    gcash_name: string;
    gcash_number: string;
    maya_name: string;
    maya_number: string;
    bank_details: string;
    opening_time: string;
    closing_time: string;
    facebook_url: string;
    instagram_url: string;
    logo_url: string;
    updated_at: string;
};

export const useGymDetails = () => {
    const [gymDetails, setGymDetails] = useState<gymDetailsType>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGymDetails = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await gymDetailService.getGymDetails();
            console.log(data);
            setGymDetails(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "Failed to load gym info");
                console.error("Gym Details Fetch Error:", err);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGymDetails();
    }, [fetchGymDetails]);

    return {
        refresh: fetchGymDetails,
        gymDetails,
        isLoading,
        error,
    };
};
