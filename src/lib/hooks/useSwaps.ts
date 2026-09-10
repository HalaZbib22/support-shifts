"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { SwapDoc } from "../types";

export interface SwapWithId extends SwapDoc {
  id: string;
}

/** Every swap the user is party to, either side. */
export function useSwaps(uid: string | null) {
  const [incoming, setIncoming] = useState<SwapWithId[]>([]);
  const [outgoing, setOutgoing] = useState<SwapWithId[]>([]);
  useEffect(() => {
    if (!uid) return;
    const map = (snap: { docs: { id: string; data: () => unknown }[] }) =>
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as SwapDoc) })).sort((a, b) => b.createdAt - a.createdAt);
    const u1 = onSnapshot(query(collection(db(), "swaps"), where("toUid", "==", uid)), (s) => setIncoming(map(s)));
    const u2 = onSnapshot(query(collection(db(), "swaps"), where("fromUid", "==", uid)), (s) => setOutgoing(map(s)));
    return () => {
      u1();
      u2();
    };
  }, [uid]);
  return { incoming, outgoing, pendingIncoming: incoming.filter((s) => s.status === "pending").length };
}
