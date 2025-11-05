"use client";

import { useSession } from "@/lib/auth-client";
import { createContext, useContext, ReactNode } from "react";

interface SessionContextType {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  error: any;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  session: null,
  isLoading: true,
  error: null,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isLoading, error } = useSession();

  return (
    <SessionContext.Provider
      value={{
        user: session?.user || null,
        session: session?.session || null,
        isLoading,
        error,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}