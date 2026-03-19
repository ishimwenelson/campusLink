// lib/hooks/useAuth.tsx
"use client";

import React, {
  createContext, useContext, useEffect, useState, ReactNode,
} from "react";
import { User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase/auth";
import { getUser } from "@/lib/firebase/firestore";
import type { CampusUser } from "@/lib/types";

export interface AuthContextType {
  user:        User | null;
  profile:     CampusUser | null;
  loading:     boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user:           null,
  profile:        null,
  loading:        true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<CampusUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    const p = await getUser(user.uid);
    setProfile(p);
  };

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser: User | null) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const p = await getUser(firebaseUser.uid);
          setProfile(p);
        } catch (error) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const contextValue: AuthContextType = {
    user,
    profile,
    loading,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
