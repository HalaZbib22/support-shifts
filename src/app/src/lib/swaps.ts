import { addDoc, collection, doc, runTransaction, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { SeatRole, ShiftDoc, SwapDoc } from "./types";

export async function requestSwap(p: { role: SeatRole; fromUid: string; toUid: string; giveShiftId: string; takeShiftId: string }) {
  const swap: SwapDoc = { ...p, status: "pending", createdAt: Date.now(), resolvedAt: null };
  await addDoc(collection(db(), "swaps"), swap);
}

/** The recipient accepts: both seats move in one transaction. */
export async function acceptSwap(swapId: string, uid: string) {
  const swapRef = doc(db(), "swaps", swapId);
  await runTransaction(db(), async (tx) => {
    const swapSnap = await tx.get(swapRef);
    if (!swapSnap.exists()) throw new Error("Swap no longer exists");
    const swap = swapSnap.data() as SwapDoc;
    if (swap.status !== "pending") throw new Error("This swap was already resolved");
    if (swap.toUid !== uid) throw new Error("Only the recipient can accept");

    const giveRef = doc(db(), "shifts", swap.giveShiftId);
    const takeRef = doc(db(), "shifts", swap.takeShiftId);
    const [give, take] = await Promise.all([tx.get(giveRef), tx.get(takeRef)]);
    const g = give.data() as ShiftDoc | undefined;
    const t = take.data() as ShiftDoc | undefined;
    if (!g || !t) throw new Error("One of the shifts is gone");
    if (g.seats[swap.role] !== swap.fromUid || t.seats[swap.role] !== swap.toUid) {
      throw new Error("Seats changed since the request was made");
    }
    tx.update(giveRef, { [`seats.${swap.role}`]: swap.toUid, swapId });
    tx.update(takeRef, { [`seats.${swap.role}`]: swap.fromUid, swapId });
    tx.update(swapRef, { status: "accepted", resolvedAt: Date.now() });
  });
}

export async function declineSwap(swapId: string) {
  await updateDoc(doc(db(), "swaps", swapId), { status: "declined", resolvedAt: Date.now() });
}

export async function cancelSwap(swapId: string) {
  await updateDoc(doc(db(), "swaps", swapId), { status: "cancelled", resolvedAt: Date.now() });
}
