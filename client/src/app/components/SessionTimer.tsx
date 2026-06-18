// src/context/sessionTimerProvider.tsx
import { useUserProfile } from "@/src/context/profileProvider";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type SessionTimerContextType = {
  elapsed: number; // seconds
  isRunning: boolean;
};

const SessionTimerContext = createContext<SessionTimerContextType>({
  elapsed: 0,
  isRunning: false,
});

export const useSessionTimer = () => useContext(SessionTimerContext);

export default function SessionTimerProvider({ children }: { children: React.ReactNode }) {
  const { sessionStatus } = useUserProfile();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunning = Boolean(sessionStatus?.has_active_session);

  useEffect(() => {
    if (isRunning) {
      if (sessionStatus?.session?.checked_in_at) {
        const checkInTime = new Date(sessionStatus?.session?.checked_in_at).getTime();
        setElapsed(Math.floor((Date.now() - checkInTime) / 1000));
      }

      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, sessionStatus?.session?.checked_in_at]);

  return (
    <SessionTimerContext.Provider value={{ elapsed, isRunning }}>
      {children}
    </SessionTimerContext.Provider>
  );
};