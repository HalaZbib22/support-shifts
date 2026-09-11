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
  /** Set when someone signs in with an account outside the allowed domain. */
  domainError: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const ALLOWED = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN?.toLowerCase() || null;
const emailDomain = (email: string | null) => email?.toLowerCase().split("@")[1] ?? null;

const Ctx = createContext<AuthState>({
  loading: true,
  user: null,
  profile: null,
  domainError: null,
  signIn: async () => {},
  signOutUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);

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
      // Wrong-domain accounts would hit opaque permission errors on every read,
      // so stop here with an explanation instead.
      if (ALLOWED && emailDomain(u.email) !== ALLOWED) {
        setDomainError(`Support Shifts is limited to @${ALLOWED} accounts. You signed in as ${u.email ?? "an outside account"}.`);
        setProfile(null);
        setLoading(false);
        await signOut(auth);
        return;
      }
      setDomainError(null);
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
    setDomainError(null);
    await signInWithPopup(firebaseAuth(), googleProvider);
  };
  const signOutUser = async () => {
    await signOut(firebaseAuth());
  };

  return (
    <Ctx.Provider value={{ loading, user, profile, domainError, signIn, signOutUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
