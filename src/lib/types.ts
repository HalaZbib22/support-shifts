export type Role = "fe" | "mobile" | "be_l1" | "be_l2";

/** Roles that occupy a paid seat on a shift. L2 is escalation-only. */
export type SeatRole = "fe" | "mobile" | "be_l1";
export const SEAT_ROLES: SeatRole[] = ["fe", "mobile", "be_l1"];
export const isSeatRole = (r: Role | null | undefined): r is SeatRole => r === "fe" || r === "mobile" || r === "be_l1";

export const ROLE_LABEL: Record<Role, string> = {
  fe: "Frontend",
  mobile: "Mobile",
  be_l1: "Backend L1",
  be_l2: "Backend L2",
};

export const PAY_PER_SHIFT = 20;

export type Slot = "morning" | "afternoon" | "evening";
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface UserDoc {
  displayName: string;
  email: string;
  photoURL: string | null;
  role: Role | null;
  isAdmin: boolean;
}

export type WeekStatus = "draft" | "open" | "locked";

export interface WeekDoc {
  status: WeekStatus;
  startDate: string; // yyyy-MM-dd (Monday)
}

export interface Handover {
  text: string;
  updatedBy: string;
  updatedAt: number; // epoch ms
}

export interface ShiftDoc {
  weekId: string;
  date: string; // yyyy-MM-dd
  day: DayKey;
  slot: Slot;
  start: string; // "18:00"
  end: string; // "23:00"
  seats: Record<SeatRole, string | null>; // uid or null
  handover?: Handover | null;
  swapId?: string | null; // set transiently on swap writes so rules can verify
}

export type SwapStatus = "pending" | "accepted" | "declined" | "cancelled";

/** A straight trade: `from` gives their seat on giveShiftId and takes `to`'s seat on takeShiftId. */
export interface SwapDoc {
  role: SeatRole;
  fromUid: string;
  toUid: string;
  giveShiftId: string;
  takeShiftId: string;
  status: SwapStatus;
  createdAt: number;
  resolvedAt: number | null;
}
