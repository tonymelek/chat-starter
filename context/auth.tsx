import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter, useSegments } from 'expo-router';

import { AuthBootstrap } from '@/components/auth-bootstrap';
import { getClientAuth } from '@/lib/firebase';

SplashScreen.preventAutoHideAsync().catch(() => {});

const PUBLIC_ROUTES = new Set(['login']);

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

function isPublicRoute(segments: string[]): boolean {
  const root = segments[0];
  return Boolean(root && PUBLIC_ROUTES.has(root));
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
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });
    return unsub;
  }, [mounted]);

  useEffect(() => {
    if (!mounted || isLoading) return;

    SplashScreen.hideAsync().catch(() => {});

    const publicRoute = isPublicRoute(segments as string[]);
    if (!user && !publicRoute) {
      router.replace('/login');
    } else if (user && publicRoute) {
      router.replace('/');
    }
  }, [user, isLoading, segments, mounted, router]);

  const publicRoute = isPublicRoute(segments as string[]);
  const holdNavigator =
    !mounted || isLoading || (!user && !publicRoute) || Boolean(user && publicRoute);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
      {holdNavigator ? <AuthBootstrap /> : null}
    </AuthContext.Provider>
  );
}
