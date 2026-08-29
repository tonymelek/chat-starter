import { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export interface UserDoc {
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  username?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  updatedAt?: ReturnType<typeof serverTimestamp>;
}

export async function syncUserDoc(user: User, extra?: Partial<UserDoc>) {
  await setDoc(
    doc(db, "users", user.uid),
    {
      email: user.email ?? "",
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
      ...extra,
    },
    { merge: true }
  );
}

export function getUserDisplayLabel(user: Pick<UserDoc, "displayName" | "email">): string {
  const name = user.displayName?.trim();
  if (name) return name;
  if (user.email) return user.email;
  return "Unknown";
}

export function getUserInitial(user: Pick<UserDoc, "displayName" | "email">): string {
  const label = getUserDisplayLabel(user);
  return label.charAt(0).toUpperCase();
}

export function getOtherParticipantId(
  participants: string[],
  currentUid: string
): string | undefined {
  return participants.find((id) => id !== currentUid);
}

export async function fetchUserProfiles(
  uids: string[]
): Promise<Record<string, UserDoc>> {
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) return {};

  const entries = await Promise.all(
    unique.map(async (uid) => {
      const snap = await getDoc(doc(db, "users", uid));
      return [uid, (snap.exists() ? snap.data() : { email: "" }) as UserDoc] as const;
    })
  );

  return Object.fromEntries(entries);
}
