"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { addDays, format } from "date-fns";
import { DAYS, SLOT_TIMES, slotsForDay, weekStart } from "@/lib/template";
import { SLOT_LABEL, DAY_LONG, isToday } from "@/lib/format";
import { seatState, type BoardCtx } from "@/lib/board";
import { ROLE, T } from "@/lib/theme";
import { SEAT_ROLES } from "@/lib/types";
import type { ShiftWithId } from "@/lib/hooks/useShifts";
import { Blueprint } from "../Blueprint";
import { SeatToken } from "./SeatToken";

/** One day at a time; the seven days are a strip of tabs with dots for "mine" / "open for me". */
export function PhoneBoard({ anchor, shifts, ctx, onOpen }: { anchor: Date; shifts: ShiftWithId[]; ctx: BoardCtx; onOpen: (s: ShiftWithId) => void }) {
  const start = weekStart(anchor);
  const todayIdx = DAYS.findIndex((_, i) => isToday(format(addDays(start, i), "yyyy-MM-dd"), ctx.now));
  const [sel, setSel] = useState(todayIdx >= 0 ? todayIdx : 5);
  const day = DAYS[sel]!;
  const dayShifts = shifts.filter((s) => s.day === day).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderTop: `3px solid ${T.text}` }}>
        {DAYS.map((d, i) => {
          const dateStr = format(addDays(start, i), "yyyy-MM-dd");
          const today = isToday(dateStr, ctx.now);
          const past = dateStr < format(ctx.now, "yyyy-MM-dd");
          const dots: string[] = [];
          for (const s of shifts.filter((x) => x.day === d)) {
            for (const r of SEAT_ROLES) {
              const st = seatState(s, r, ctx);
              if (st.isMine) dots.push(ROLE[r].fill);
              else if (st.claimable) dots.push(T.n400);
            }
          }
          return (
            <Box key={d} component="button" type="button" onClick={() => setSel(i)} sx={{ all: "unset", cursor: "pointer", p: "8px 0 6px", textAlign: "center", borderBottom: `3px solid ${sel === i ? T.text : "transparent"}`, opacity: past ? 0.55 : 1 }}>
              <Typography sx={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: today ? T.accent700 : "rgba(29,31,32,0.6)" }}>{d[0]!.toUpperCase()}</Typography>
              <Typography sx={{ fontFamily: T.fontHeading, fontWeight: 600, fontSize: 22, lineHeight: 1.1 }}>{format(addDays(start, i), "d")}</Typography>
              <Box sx={{ display: "flex", justifyContent: "center", gap: "2px", mt: 0.5, height: 4 }}>
                {dots.slice(0, 3).map((c, k) => <Box key={k} sx={{ width: 4, height: 4, background: c }} />)}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ pt: 1.75, display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <Typography variant="h3">{DAY_LONG[day]} {format(addDays(start, sel), "d MMM")}</Typography>
          <Typography variant="body2" color="text.secondary">{dayShifts.length} {dayShifts.length === 1 ? "shift" : "shifts"} · {dayShifts.length * 3} seats</Typography>
        </Box>
        {slotsForDay(day).map((slot) => {
          const shift = dayShifts.find((s) => s.slot === slot);
          return (
            <Blueprint key={slot} sx={{ p: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.75 }}>
                <Typography variant="subtitle2">{SLOT_LABEL[slot]}</Typography>
                <Typography variant="caption" color="text.secondary">{SLOT_TIMES[slot].label}</Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {shift && SEAT_ROLES.map((r) => <SeatToken key={r} size="phone" seat={seatState(shift, r, ctx)} onClick={() => onOpen(shift)} />)}
              </Box>
            </Blueprint>
          );
        })}
      </Box>
    </Box>
  );
}
