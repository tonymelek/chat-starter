import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase";
import { useRouter, useSegments } from "expo-router";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const auth = getClientAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return unsub;
  }, [mounted]);

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = (segments as any)[0] === "(tabs)" || (segments as any).length === 0 || (segments as any)[0] === "";
    const isLoginScreen = segments[0] === "login";

    if (!user && (inTabsGroup || !segments[0])) {
      // Redirect unauthenticated users to login
      router.replace("/login");
    } else if (user && isLoginScreen) {
      // Redirect authenticated users to the main app if they try to access login
      router.replace("/");
    }
  }, [user, isLoading, segments]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
