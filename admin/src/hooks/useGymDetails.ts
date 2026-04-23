import { useCallback, useEffect, useState } from "react";
import { gymDetailService } from "../services/gymDetails.service";
import type { gymDetailsType } from "../types";


export const useGymDetails = () => {
  const [gymDetails, setGymDetails] = useState<gymDetailsType>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGymDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await gymDetailService.getGymDetails();
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
