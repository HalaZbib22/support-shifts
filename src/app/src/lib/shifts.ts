import { doc, runTransaction, updateDoc, writeBatch, deleteField } from "firebase/firestore";
import { db } from "./firebase";
import { buildWeekShifts } from "./template";
import type { SeatRole, ShiftDoc, WeekStatus } from "./types";

export class SeatTakenError extends Error {}

/** Claim an open seat. Fails if someone got there first. */
export async function claimSeat(shiftId: string, role: SeatRole, uid: string) {
  const ref = doc(db(), "shifts", shiftId);
  await runTransaction(db(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Shift not found");
    const data = snap.data() as ShiftDoc;
    if (data.seats[role] !== null) throw new SeatTakenError("Seat already taken");
    tx.update(ref, { [`seats.${role}`]: uid });
  });
}

export async function releaseSeat(shiftId: string, role: SeatRole, uid: string) {
  const ref = doc(db(), "shifts", shiftId);
  await runTransaction(db(), async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as ShiftDoc;
    if (data.seats[role] !== uid) throw new Error("That seat isn't yours");
    tx.update(ref, { [`seats.${role}`]: null });
  });
}

/** Admin: generate a week from the Support Plan template. */
export async function createWeek(date: Date) {
  const { weekId, startDate, shifts } = buildWeekShifts(date);
  const batch = writeBatch(db());
  batch.set(doc(db(), "weeks", weekId), { status: "draft", startDate });
  for (const s of shifts) batch.set(doc(db(), "shifts", s.id), s.data);
  await batch.commit();
  return weekId;
}

export async function setWeekStatus(weekId: string, status: WeekStatus) {
  await updateDoc(doc(db(), "weeks", weekId), { status });
}

/** Admin: delete a draft week and its shifts. */
export async function deleteWeek(weekId: string, shiftIds: string[]) {
  const batch = writeBatch(db());
  for (const id of shiftIds) batch.delete(doc(db(), "shifts", id));
  batch.delete(doc(db(), "weeks", weekId));
  await batch.commit();
}

export async function saveHandover(shiftId: string, uid: string, text: string) {
  await updateDoc(doc(db(), "shifts", shiftId), {
    handover: text.trim() ? { text: text.trim(), updatedBy: uid, updatedAt: Date.now() } : deleteField(),
  });
}
