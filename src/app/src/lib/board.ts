import { isPastShift } from "./format";
import type { SeatState } from "@/components/board/SeatToken";
import type { ShiftWithId } from "./hooks/useShifts";
import type { UsersMap } from "./hooks/useUsers";
import type { WeeksMap } from "./hooks/useWeeks";
import type { SwapWithId } from "./hooks/useSwaps";
import { SEAT_ROLES, type SeatRole } from "./types";

export interface BoardCtx {
  uid: string;
  myRole: SeatRole | null;
  users: UsersMap;
  weeks: WeeksMap;
  swaps: SwapWithId[]; // all swaps involving me
  now: Date;
  paused?: boolean; // connection lost: nothing is claimable
}

export function seatState(shift: ShiftWithId, role: SeatRole, ctx: BoardCtx): SeatState {
  const holder = shift.seats[role];
  const status = ctx.weeks[shift.weekId]?.status;
  const past = isPastShift(shift, ctx.now);
  const pending = ctx.swaps.some((s) => s.status === "pending" && s.role === role && (s.giveShiftId === shift.id || s.takeShiftId === shift.id));
  return {
    role,
    holderName: holder ? ctx.users[holder]?.displayName ?? "…" : null,
    isMine: holder === ctx.uid,
    claimable: !ctx.paused && holder === null && ctx.myRole === role && status === "open" && !past,
    past,
    pending,
  };
}

export function openForMe(shifts: ShiftWithId[], ctx: BoardCtx) {
  if (!ctx.myRole) return 0;
  return shifts.filter((s) => seatState(s, ctx.myRole!, ctx).claimable).length;
}

/** Sort chronologically. */
export function byTime(a: ShiftWithId, b: ShiftWithId) {
  return a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date);
}

/** The shift immediately before this one (source of the handover you receive). */
export function previousShift(shift: ShiftWithId, all: ShiftWithId[]) {
  const sorted = [...all].sort(byTime);
  const i = sorted.findIndex((s) => s.id === shift.id);
  return i > 0 ? sorted[i - 1] : null;
}

/** Shifts per person in a month (only published/locked weeks count; drafts aren't real yet). */
export function monthCounts(shifts: ShiftWithId[], weeks: WeeksMap, monthPrefix: string) {
  const counts: Record<string, number> = {};
  for (const s of shifts) {
    if (!s.date.startsWith(monthPrefix)) continue;
    if (weeks[s.weekId]?.status === "draft") continue;
    for (const r of SEAT_ROLES) {
      const u = s.seats[r];
      if (u) counts[u] = (counts[u] ?? 0) + 1;
    }
  }
  return counts;
}

export function median(nums: number[]) {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}
