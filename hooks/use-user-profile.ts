import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { UserDoc } from "@/lib/users";

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string | null;
  username: string;
  bio: string;
  location: string;
  phone: string;
}

function buildProfile(user: NonNullable<ReturnType<typeof useAuth>["user"]>, data?: UserDoc): UserProfile {
  const defaultUsername = user.email?.split("@")[0] ?? "";
  return {
    displayName: user.displayName?.trim() || data?.displayName?.trim() || "",
    email: user.email ?? data?.email ?? "",
    photoURL: user.photoURL ?? data?.photoURL ?? null,
    username: data?.username?.trim() || defaultUsername,
    bio: data?.bio?.trim() || "",
    location: data?.location?.trim() || "",
    phone: data?.phone?.trim() || user.phoneNumber || "",
  };
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      setProfile(buildProfile(user, snap.data() as UserDoc | undefined));
    } catch {
      setProfile(buildProfile(user));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, setProfile, loading, refresh, user };
}

export function formatUsername(username: string): string {
  const trimmed = username.trim();
  return trimmed ? `@${trimmed.replace(/^@/, "")}` : "@user";
}
