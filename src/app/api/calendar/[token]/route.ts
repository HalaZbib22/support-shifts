import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { buildIcs, seatLine, type CalEvent } from "@/lib/ics";
import { SLOT_TIMES } from "@/lib/template";
import { SLOT_LABEL, DAY_LONG } from "@/lib/format";
import { PAY_PER_SHIFT, ROLE_LABEL, SEAT_ROLES, type ShiftDoc, type UserDoc, type WeekDoc } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Personal shift feed, subscribed to by Google Calendar / Outlook.
 * Calendar clients can't authenticate, so the URL carries an unguessable token
 * that maps to exactly one user. Draft weeks are excluded — a shift isn't real
 * until an admin publishes it.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  // The URL ends in .ics so calendar clients recognise it; strip that to get the token.
  const token = (await params).token.replace(/\.ics$/, "");
  if (!token || token.length < 20) return new NextResponse("Not found", { status: 404 });

  let db;
  try {
    db = adminDb();
  } catch {
    return new NextResponse("Calendar feed is not configured on this deployment.", { status: 503 });
  }

  const match = await db.collection("users").where("calendarToken", "==", token).limit(1).get();
  if (match.empty) return new NextResponse("Not found", { status: 404 });

  const meDoc = match.docs[0]!;
  const me = meDoc.data() as UserDoc;
  const uid = meDoc.id;

  // Everyone's names, for "who you're on with".
  const usersSnap = await db.collection("users").get();
  const names: Record<string, string> = {};
  usersSnap.forEach((d) => (names[d.id] = (d.data() as UserDoc).displayName));

  const weeksSnap = await db.collection("weeks").get();
  const weeks: Record<string, WeekDoc> = {};
  weeksSnap.forEach((d) => (weeks[d.id] = d.data() as WeekDoc));

  // Firestore can't OR across three fields, so query each seat separately.
  const results = await Promise.all(SEAT_ROLES.map((r) => db.collection("shifts").where(`seats.${r}`, "==", uid).get()));

  const seen = new Set<string>();
  const events: CalEvent[] = [];

  for (const snap of results) {
    for (const doc of snap.docs) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      const s = doc.data() as ShiftDoc;
      const status = weeks[s.weekId]?.status;
      if (status !== "open" && status !== "locked") continue;

      const myRole = SEAT_ROLES.find((r) => s.seats[r] === uid);
      if (!myRole) continue;

      const others = SEAT_ROLES.filter((r) => r !== myRole).map((r) =>
        seatLine(r, s.seats[r] ? names[s.seats[r]!] ?? "Unknown" : "— open —"),
      );

      events.push({
        uid: `${doc.id}-${uid}@support-shifts`,
        start: s.date,
        startTime: SLOT_TIMES[s.slot].start,
        endTime: SLOT_TIMES[s.slot].end,
        summary: `Support shift · ${ROLE_LABEL[myRole]}`,
        description: [
          `${DAY_LONG[s.day]} ${SLOT_LABEL[s.slot].toLowerCase()} shift, ${SLOT_TIMES[s.slot].label}.`,
          "",
          `You: ${ROLE_LABEL[myRole]}`,
          ...others,
          "",
          `$${PAY_PER_SHIFT} for this shift.${status === "locked" ? " Week is locked." : ""}`,
        ].join("\n"),
        stamp: new Date(),
      });
    }
  }

  events.sort((a, b) => (a.start === b.start ? a.startTime.localeCompare(b.startTime) : a.start.localeCompare(b.start)));

  return new NextResponse(buildIcs(`Support shifts · ${me.displayName}`, events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="support-shifts.ics"`,
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
