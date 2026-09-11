"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, type FirestoreError } from "firebase/firestore";
import { db } from "../firebase";
import type { ShiftDoc } from "../types";

export interface ShiftWithId extends ShiftDoc {
  id: string;
}

interface State {
  shifts: ShiftWithId[];
  loading: boolean;
  error: FirestoreError | null;
  lastGoodAt: Date | null;
}

/** Live shifts with date in [from, to] (yyyy-MM-dd, inclusive). Keeps the last good copy on error. */
export function useShifts(from: string, to: string, enabled: boolean) {
  const [state, setState] = useState<State>({ shifts: [], loading: true, error: null, lastGoodAt: null });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    const q = query(collection(db(), "shifts"), where("date", ">=", from), where("date", "<=", to));
    return onSnapshot(
      q,
      (snap) =>
        setState({
          shifts: snap.docs.map((d) => ({ id: d.id, ...(d.data() as ShiftDoc) })),
          loading: false,
          error: null,
          lastGoodAt: new Date(),
        }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
  }, [from, to, enabled, retryKey]);

  return { ...state, retry: () => setRetryKey((k) => k + 1) };
}
