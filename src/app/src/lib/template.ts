import {
  addDays,
  addWeeks,
  format,
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
} from "date-fns";
import type { DayKey, ShiftDoc, Slot } from "./types";

export const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABEL: Record<DayKey, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

export const SLOTS: Slot[] = ["morning", "afternoon", "evening"];
export const SLOT_TIMES: Record<Slot, { start: string; end: string; label: string }> = {
  morning: { start: "08:00", end: "13:00", label: "8 AM – 1 PM" },
  afternoon: { start: "13:00", end: "18:00", label: "1 PM – 6 PM" },
  evening: { start: "18:00", end: "23:00", label: "6 PM – 11 PM" },
};

/** The Support Plan template: weekdays evening only, weekends all three slots. */
export function slotsForDay(day: DayKey): Slot[] {
  return day === "sat" || day === "sun" ? SLOTS : ["evening"];
}

export function weekIdFor(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

export function weekStart(date: Date): Date {
  return startOfISOWeek(date);
}

export function shiftWeek(date: Date, delta: number): Date {
  return addWeeks(date, delta);
}

export function shiftId(weekId: string, day: DayKey, slot: Slot) {
  return `${weekId}_${day}_${slot}`;
}

/** Builds the 11 shift documents for the week containing `date`. */
export function buildWeekShifts(date: Date): {
  weekId: string;
  startDate: string;
  shifts: { id: string; data: ShiftDoc }[];
} {
  const start = weekStart(date);
  const weekId = weekIdFor(start);
  const shifts: { id: string; data: ShiftDoc }[] = [];
  DAYS.forEach((day, i) => {
    const d = addDays(start, i);
    for (const slot of slotsForDay(day)) {
      shifts.push({
        id: shiftId(weekId, day, slot),
        data: {
          weekId,
          date: format(d, "yyyy-MM-dd"),
          day,
          slot,
          start: SLOT_TIMES[slot].start,
          end: SLOT_TIMES[slot].end,
          seats: { fe: null, mobile: null, be_l1: null },
        },
      });
    }
  });
  return { weekId, startDate: format(start, "yyyy-MM-dd"), shifts };
}
