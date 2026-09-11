"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { WeekDoc } from "../types";

export type WeeksMap = Record<string, WeekDoc>;

/** All week docs (small collection). `undefined` until the first snapshot. */
export function useWeeks(enabled: boolean) {
  const [weeks, setWeeks] = useState<WeeksMap | undefined>(undefined);
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(collection(db(), "weeks"), (snap) => {
      const next: WeeksMap = {};
      snap.forEach((d) => (next[d.id] = d.data() as WeekDoc));
      setWeeks(next);
    });
  }, [enabled]);
  return weeks;
}
