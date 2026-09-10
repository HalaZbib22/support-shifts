"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db, firebaseAuth, googleProvider } from "@/lib/firebase";
import type { UserDoc } from "@/lib/types";

interface AuthState {
  loading: boolean;
  user: User | null;
  profile: UserDoc | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const Ctx = createContext<AuthState>({
  loading: true,
  user: null,
  profile: null,
  signIn: async () => {},
  signOutUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);

  useEffect(() => {
    const auth = firebaseAuth();
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      unsubProfile?.();
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      // First sign-in: create the profile with no role; an admin assigns one.
      const ref = doc(db(), "users", u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          displayName: u.displayName ?? u.email ?? "Unknown",
          email: u.email ?? "",
          photoURL: u.photoURL ?? null,
          role: null,
          isAdmin: false,
        } satisfies UserDoc);
      }
      unsubProfile = onSnapshot(ref, (s) => {
        setProfile((s.data() as UserDoc) ?? null);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, []);

  const signIn = async () => {
    await signInWithPopup(firebaseAuth(), googleProvider);
  };
  const signOutUser = async () => {
    await signOut(firebaseAuth());
  };

  return (
    <Ctx.Provider value={{ loading, user, profile, signIn, signOutUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
