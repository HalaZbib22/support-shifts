"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { UserDoc } from "../types";

export type UsersMap = Record<string, UserDoc>;

/** Live map of uid → profile, used to put names on seats and for the roster. */
export function useUsers(enabled: boolean) {
  const [users, setUsers] = useState<UsersMap>({});
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(collection(db(), "users"), (snap) => {
      const next: UsersMap = {};
      snap.forEach((d) => (next[d.id] = d.data() as UserDoc));
      setUsers(next);
    });
  }, [enabled]);
  return users;
}
