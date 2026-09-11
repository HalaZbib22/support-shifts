import { ROLE_LABEL, type SeatRole } from "./types";

export interface CalEvent {
  uid: string;
  start: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  summary: string;
  description: string;
  stamp: Date;
}

/** Beirut. Written as a VTIMEZONE so clients place the events correctly wherever they are. */
export const TZID = "Asia/Beirut";
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZID}`,
  "BEGIN:STANDARD",
  "DTSTART:19701025T000000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "TZOFFSETFROM:+0300",
  "TZOFFSETTO:+0200",
  "TZNAME:EET",
  "END:STANDARD",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700329T000000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0300",
  "TZNAME:EEST",
  "END:DAYLIGHT",
  "END:VTIMEZONE",
];

/** RFC 5545 escaping: backslash, semicolon, comma, newline. */
function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines must be folded at 75 octets; continuation lines start with a space. */
function fold(line: string) {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    const size = out.length === 0 ? 75 : 74;
    let end = Math.min(i + size, bytes.length);
    // Don't split a multi-byte character.
    while (end > i && end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end--;
    out.push((out.length ? " " : "") + bytes.subarray(i, end).toString("utf8"));
    i = end;
  }
  return out.join("\r\n");
}

const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const local = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;

export function buildIcs(name: string, events: CalEvent[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Support Shifts//Rota//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`,
    `X-WR-TIMEZONE:${TZID}`,
    // Ask clients to re-poll roughly every 30 minutes.
    "REFRESH-INTERVAL;VALUE=DURATION:PT30M",
    "X-PUBLISHED-TTL:PT30M",
    ...VTIMEZONE,
  ];

  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${utcStamp(e.stamp)}`,
      `DTSTART;TZID=${TZID}:${local(e.start, e.startTime)}`,
      `DTEND;TZID=${TZID}:${local(e.start, e.endTime)}`,
      `SUMMARY:${esc(e.summary)}`,
      `DESCRIPTION:${esc(e.description)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(e.summary)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function seatLine(role: SeatRole, name: string) {
  return `${ROLE_LABEL[role]}: ${name}`;
}
