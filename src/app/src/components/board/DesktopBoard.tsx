"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FileText } from "lucide-react";
import { addDays, format } from "date-fns";
import { DAYS, DAY_LABEL, SLOTS, SLOT_TIMES, slotsForDay, weekStart } from "@/lib/template";
import { SLOT_LABEL, isToday } from "@/lib/format";
import { seatState, type BoardCtx } from "@/lib/board";
import { T } from "@/lib/theme";
import { SEAT_ROLES } from "@/lib/types";
import type { ShiftWithId } from "@/lib/hooks/useShifts";
import { SeatToken } from "./SeatToken";

export function DesktopBoard({ anchor, shifts, ctx, onOpen }: { anchor: Date; shifts: ShiftWithId[]; ctx: BoardCtx; onOpen: (s: ShiftWithId) => void }) {
  const start = weekStart(anchor);
  const byKey = new Map(shifts.map((s) => [`${s.day}_${s.slot}`, s]));
  const ROW = 156;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "82px repeat(7, minmax(0, 1fr))", borderTop: `3px solid ${T.text}` }}>
      {/* Row labels column */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ height: 70 }} />
        {SLOTS.map((slot) => (
          <Box key={slot} sx={{ height: ROW, pt: 1.25, pr: 1, borderTop: `1px solid ${T.rule}` }}>
            <Typography variant="subtitle2">{SLOT_LABEL[slot]}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>{SLOT_TIMES[slot].label}</Typography>
          </Box>
        ))}
      </Box>

      {DAYS.map((day, i) => {
        const date = addDays(start, i);
        const dateStr = format(date, "yyyy-MM-dd");
        const today = isToday(dateStr, ctx.now);
        const past = dateStr < format(ctx.now, "yyyy-MM-dd");
        return (
          <Box key={day} sx={{ display: "flex", flexDirection: "column", borderLeft: `1px solid ${T.rule}`, minWidth: 0 }}>
            <Box sx={{ height: 70, px: 1.25, pt: 1.25, position: "relative", opacity: past ? 0.55 : 1 }}>
              <Typography variant="subtitle2" sx={{ color: today ? T.accent700 : T.muted60 }}>{DAY_LABEL[day]}</Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography sx={{ fontFamily: T.fontHeading, fontWeight: 600, fontSize: 32, lineHeight: 1.1 }}>{format(date, "d")}</Typography>
                {today && <Box component="span" sx={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: T.accent, color: T.onFill, px: 0.75, py: "1px" }}>Today</Box>}
              </Box>
              {today && <Box sx={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 3, background: T.accent }} />}
            </Box>

            {SLOTS.map((slot) => {
              const on = slotsForDay(day).includes(slot);
              if (!on) {
                return (
                  <Box key={slot} sx={{ height: ROW, background: T.off, borderTop: slot === "morning" ? "1px solid ${T.rule}" : "1px solid ${T.hairline}", display: "flex", justifyContent: "center", pt: 1.5 }}>
                    {slot === "morning" && <Typography sx={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted38 }}>Office hours</Typography>}
                  </Box>
                );
              }
              const shift = byKey.get(`${day}_${slot}`);
              const foot = shift ? footFor(shift, ctx, today) : null;
              return (
                <Box key={slot} sx={{ height: ROW, borderTop: `1px solid ${T.rule}`, p: "8px 8px 6px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {shift && SEAT_ROLES.map((r) => <SeatToken key={r} seat={seatState(shift, r, ctx)} onClick={() => onOpen(shift)} />)}
                  {foot && (
                    <Box sx={{ mt: "auto", display: "flex", alignItems: "center", gap: 0.6, fontSize: 11, color: foot.live ? T.accent700 : T.muted, minWidth: 0 }}>
                      {foot.live && <Box component="span" sx={{ width: 7, height: 7, background: T.accent, flex: "none" }} />}
                      {foot.note && <FileText size={12} strokeWidth={1.5} style={{ flex: "none" }} />}
                      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{foot.text}</Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}

function footFor(shift: ShiftWithId, ctx: BoardCtx, today: boolean) {
  const past = seatState(shift, "fe", ctx).past;
  if (past) return shift.handover ? { text: "Handover left", note: true, live: false } : null;
  if (today) return { text: `Starts ${SLOT_TIMES[shift.slot].label.split(" – ")[0]} · tonight`, note: false, live: true };
  return null;
}
