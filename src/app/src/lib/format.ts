import { format, parseISO, isSameDay, isBefore, startOfDay } from "date-fns";
import type { DayKey, ShiftDoc, Slot } from "./types";
import { SLOT_TIMES, weekIdFor, weekStart } from "./template";
import { addDays } from "date-fns";

export const SLOT_LABEL: Record<Slot, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
export const DAY_LONG: Record<DayKey, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
};

export function weekNumber(weekId: string) {
  return Number(weekId.split("-W")[1]);
}

/** "7 – 13 September 2026" */
export function weekRangeLabel(anchor: Date, withYear = true) {
  const s = weekStart(anchor);
  const e = addDays(s, 6);
  const sameMonth = s.getMonth() === e.getMonth();
  const left = sameMonth ? format(s, "d") : format(s, "d MMM");
  return `${left} – ${format(e, withYear ? "d MMMM yyyy" : "d MMM")}`;
}

export function weekTitle(anchor: Date) {
  return `Week ${weekNumber(weekIdFor(anchor))}`;
}

/** "Sat 12 Sep · 8 AM – 1 PM" */
export function shiftShort(s: ShiftDoc) {
  return `${format(parseISO(s.date), "EEE d MMM")} · ${SLOT_TIMES[s.slot].label}`;
}

export function shiftKind(s: ShiftDoc) {
  const weekend = s.day === "sat" || s.day === "sun";
  return `${weekend ? "Weekend" : "Weekday"} ${s.slot}`;
}

export function isPastShift(s: ShiftDoc, now = new Date()) {
  const d = parseISO(s.date);
  if (isBefore(d, startOfDay(now)) && !isSameDay(d, now)) return true;
  if (isSameDay(d, now)) {
    const [h] = s.end.split(":").map(Number);
    return now.getHours() >= h;
  }
  return false;
}

export function isToday(date: string, now = new Date()) {
  return isSameDay(parseISO(date), now);
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export function firstName(name: string) {
  return name.split(/\s+/)[0] ?? name;
}

export function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}
