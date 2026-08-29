import { getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and add your Firebase web app config. See docs/SETUP.md.`
    );
  }
  return value;
}

export const firebaseConfig = {
  apiKey: env("EXPO_PUBLIC_FIREBASE_API_KEY"),
  authDomain: env("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: env("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: env("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: env("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: env("EXPO_PUBLIC_FIREBASE_APP_ID"),
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const storageBucket =
  process.env.EXPO_PUBLIC_FIREBASE_STORAGE_GS_URL ?? `gs://${firebaseConfig.projectId}`;

let authInstance: Auth | undefined;

/** Lazy Auth — only call from client code (useEffect, handlers), not at module load. */
export function getClientAuth(): Auth {
  if (authInstance) return authInstance;

  if (Platform.OS === "web") {
    authInstance = getAuth(app);
    return authInstance;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require("firebase/auth");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require("@react-native-async-storage/async-storage");

    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage.default ?? AsyncStorage),
    });
  } catch {
    authInstance = getAuth(app);
  }

  return authInstance;
}

export const db = getFirestore(app);
export const storage = getStorage(app, storageBucket);
