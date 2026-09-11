"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { format, parseISO } from "date-fns";
import { SLOT_TIMES } from "@/lib/template";
import { SLOT_LABEL, DAY_LONG, isPastShift } from "@/lib/format";
import { byTime } from "@/lib/board";
import { ROLE, T } from "@/lib/theme";
import { ROLE_LABEL, SEAT_ROLES, type SeatRole } from "@/lib/types";
import type { ShiftWithId } from "@/lib/hooks/useShifts";
import type { UsersMap } from "@/lib/hooks/useUsers";
import type { WeeksMap } from "@/lib/hooks/useWeeks";
import { Blueprint } from "./Blueprint";

/** Upcoming shifts you hold, and who you're on with. */
export function MyShifts({ shifts, weeks, users, uid, now, onOpen, limit = 4 }: {
  shifts: ShiftWithId[];
  weeks: WeeksMap;
  users: UsersMap;
  uid: string;
  now: Date;
  onOpen: (s: ShiftWithId) => void;
  limit?: number;
}) {
  const mine = shifts
    .filter((s) => SEAT_ROLES.some((r) => s.seats[r] === uid))
    .filter((s) => !isPastShift(s, now))
    .filter((s) => weeks[s.weekId]?.status !== "draft")
    .sort(byTime)
    .slice(0, limit);

  if (mine.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Your next shifts</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(250px, 1fr))" }, gap: 1.75 }}>
        {mine.map((s) => {
          const myRole = SEAT_ROLES.find((r) => s.seats[r] === uid)! as SeatRole;
          const c = ROLE[myRole];
          return (
            <Blueprint key={s.id} component="button" onClick={() => onOpen(s)} sx={{ all: "unset", cursor: "pointer", boxSizing: "border-box", border: `1px solid ${T.divider}`, p: "12px 14px", "&:hover": { background: c.tint }, "&:focus-visible": { outline: `2px solid ${c.fill}`, outlineOffset: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
                <Typography sx={{ fontFamily: T.fontHeading, fontWeight: 600, fontSize: 20 }}>
                  {DAY_LONG[s.day].slice(0, 3)} {format(parseISO(s.date), "d MMM")}
                </Typography>
                <Box component="span" sx={{ fontSize: 10, letterSpacing: "0.06em", fontWeight: 600, color: T.onFill, background: c.fill, px: 0.75, py: "2px" }}>{c.short}</Box>
              </Box>
              <Typography variant="body2" color="text.secondary">{SLOT_LABEL[s.slot]} · {SLOT_TIMES[s.slot].label}</Typography>
              <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.25 }}>
                {SEAT_ROLES.filter((r) => r !== myRole).map((r) => (
                  <Typography key={r} variant="caption" sx={{ color: s.seats[r] ? T.text : T.n600 }}>
                    <Box component="span" sx={{ display: "inline-block", width: 6, height: 6, background: ROLE[r].fill, mr: 0.75, verticalAlign: "middle" }} />
                    {ROLE_LABEL[r]}: {s.seats[r] ? users[s.seats[r]!]?.displayName ?? "…" : "open"}
                  </Typography>
                ))}
              </Box>
            </Blueprint>
          );
        })}
      </Box>
    </Box>
  );
}
