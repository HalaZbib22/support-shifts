import { doc, updateDoc } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import { db } from "./firebase";
import { SLOT_TIMES } from "./template";
import { SLOT_LABEL, DAY_LONG } from "./format";
import { PAY_PER_SHIFT, ROLE_LABEL, SEAT_ROLES, type SeatRole, type ShiftDoc } from "./types";

/** Unguessable, and regenerable if someone shares their link by accident. */
export function newCalendarToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function setCalendarToken(uid: string, token: string) {
  await updateDoc(doc(db(), "users", uid), { calendarToken: token });
}

export function feedUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/api/calendar/${token}.ics`;
}

/** One-click subscribe in Google Calendar — opens an "Add calendar?" prompt. */
export function googleSubscribeUrl(token: string) {
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl(token))}`;
}

/** Hands the feed to whatever calendar app owns webcal:// (Apple Calendar, Outlook). */
export function webcalUrl(token: string) {
  return feedUrl(token).replace(/^https?:/, "webcal:");
}

/** One-off "Add to Google Calendar" link for a single shift. */
export function googleCalendarUrl(shift: ShiftDoc, myRole: SeatRole, names: Record<string, string>) {
  const stamp = (time: string) => `${shift.date.replace(/-/g, "")}T${time.replace(":", "")}00`;
  const others = SEAT_ROLES.filter((r) => r !== myRole).map(
    (r) => `${ROLE_LABEL[r]}: ${shift.seats[r] ? names[shift.seats[r]!] ?? "Unknown" : "— open —"}`,
  );
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Support shift · ${ROLE_LABEL[myRole]}`,
    dates: `${stamp(SLOT_TIMES[shift.slot].start)}/${stamp(SLOT_TIMES[shift.slot].end)}`,
    ctz: "Asia/Beirut",
    details: [
      `${DAY_LONG[shift.day]} ${format(parseISO(shift.date), "d MMM")} · ${SLOT_LABEL[shift.slot].toLowerCase()}, ${SLOT_TIMES[shift.slot].label}`,
      "",
      `You: ${ROLE_LABEL[myRole]}`,
      ...others,
      "",
      `$${PAY_PER_SHIFT} for this shift.`,
    ].join("\n"),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
