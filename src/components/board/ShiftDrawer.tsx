"use client";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { CalendarPlus, Plus, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { SLOT_TIMES, weekIdFor } from "@/lib/template";
import { SLOT_LABEL, DAY_LONG, shiftShort, weekNumber } from "@/lib/format";
import { seatState, previousShift, median, type BoardCtx } from "@/lib/board";
import { ROLE, T } from "@/lib/theme";
import { PAY_PER_SHIFT, ROLE_LABEL, SEAT_ROLES } from "@/lib/types";
import { claimSeat, releaseSeat, saveHandover, SeatTakenError } from "@/lib/shifts";
import type { ShiftWithId } from "@/lib/hooks/useShifts";
import { Blueprint } from "../Blueprint";
import { SwapRequestDialog } from "./SwapRequestDialog";
import { googleCalendarUrl } from "@/lib/calendar";

interface Props {
  shift: ShiftWithId | null;
  allShifts: ShiftWithId[];
  ctx: BoardCtx;
  counts: Record<string, number>; // this month's per-person shift counts
  onClose: () => void;
  onToast: (msg: string, severity: "success" | "error") => void;
}

export function ShiftDrawer({ shift, allShifts, ctx, counts, onClose, onToast }: Props) {
  const phone = useMediaQuery("(max-width:720px)");
  const [busy, setBusy] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => setNote(shift?.handover?.text ?? ""), [shift?.id, shift?.handover?.text]);

  const live = shift ? allShifts.find((s) => s.id === shift.id) ?? shift : null;
  const status = live ? ctx.weeks[live.weekId]?.status : undefined;
  const prev = live ? previousShift(live, allShifts) : null;
  const iHold = !!live && SEAT_ROLES.some((r) => live.seats[r] === ctx.uid);
  const canEditNote = iHold && status !== "locked";

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      onToast(ok, "success");
    } catch (e) {
      onToast(e instanceof SeatTakenError ? "Someone claimed that seat just before you." : e instanceof Error ? e.message : "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  };

  const myCount = counts[ctx.uid] ?? 0;
  const teamMedian = median(Object.values(counts));

  return (
    <Drawer anchor={phone ? "bottom" : "right"} open={!!shift} onClose={onClose} slotProps={{ paper: { sx: { width: phone ? "100%" : 440, maxHeight: phone ? "92vh" : "100%", borderTop: phone ? `1px solid ${T.divider}` : "none" } } }}>
      {live && (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
          <Box sx={{ p: "18px 22px 14px", borderBottom: "1px solid rgba(29,31,32,0.12)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">{DAY_LONG[live.day]} {format(parseISO(live.date), "d MMM")} · {SLOT_LABEL[live.slot]}</Typography>
              <Typography variant="h2">{SLOT_TIMES[live.slot].label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                Week {weekNumber(weekIdFor(parseISO(live.date)))} · {status === "open" ? "published" : status === "locked" ? "locked" : "draft"} · ${PAY_PER_SHIFT} per seat
              </Typography>
            </Box>
            <IconButton onClick={onClose} aria-label="Close" size="small" sx={{ borderRadius: 0 }}><X size={16} strokeWidth={1.5} /></IconButton>
          </Box>

          <Box sx={{ p: "16px 22px", display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25 }}>Seats</Typography>
            {SEAT_ROLES.map((r) => {
              const st = seatState(live, r, ctx);
              const c = ROLE[r];
              const holder = live.seats[r];
              const row = { display: "flex", alignItems: "center", gap: 1.25, minHeight: 48, px: 1.5 } as const;
              if (st.isMine) {
                return (
                  <Box key={r} sx={{ ...row, background: c.fill, color: "#fff" }}>
                    <Box component="span" sx={{ fontSize: 10, letterSpacing: "0.06em", fontWeight: 600, width: 22 }}>{c.short}</Box>
                    <Box sx={{ flex: 1, fontWeight: 600 }}>You{st.pending ? " · swap pending" : ""}</Box>
                    {status === "open" && !st.past && (
                      <>
                        <Button size="small" disabled={busy || st.pending} onClick={() => setSwapOpen(true)} sx={{ height: 30, color: "#fff", border: "1px solid rgba(255,255,255,0.55)", fontSize: 13 }}>Request swap</Button>
                        <Button size="small" disabled={busy || st.pending} onClick={() => run(() => releaseSeat(live.id, r, ctx.uid), "Seat released")} sx={{ height: 30, color: "#fff", border: "1px solid rgba(255,255,255,0.55)", fontSize: 13 }}>Release</Button>
                      </>
                    )}
                  </Box>
                );
              }
              if (holder === null && st.claimable) {
                return (
                  <Box key={r} sx={{ ...row, border: `1.5px dashed ${c.fill}`, background: c.tint, color: c.deep }}>
                    <Box component="span" sx={{ fontSize: 10, letterSpacing: "0.06em", fontWeight: 600, width: 22 }}>{c.short}</Box>
                    <Box sx={{ flex: 1, fontWeight: 600 }}>Open · your role</Box>
                    <Blueprint sx={{ border: "none" }}>
                      <Button variant="contained" size="small" disabled={busy} onClick={() => run(() => claimSeat(live.id, r, ctx.uid), `Claimed ${shiftShort(live)}`)} startIcon={<Plus size={13} strokeWidth={2} />} sx={{ height: 32, background: c.fill, "&:hover": { background: c.deep } }}>
                        Claim seat · ${PAY_PER_SHIFT}
                      </Button>
                    </Blueprint>
                  </Box>
                );
              }
              if (holder === null) {
                return (
                  <Box key={r} sx={{ ...row, border: `1px dashed ${T.n400}`, color: T.n600 }}>
                    <Box component="span" sx={{ fontSize: 10, letterSpacing: "0.06em", fontWeight: 600, width: 22 }}>{c.short}</Box>
                    <Box sx={{ flex: 1 }}>{st.past ? "Unfilled" : "Open"} · {ROLE_LABEL[r]} seat</Box>
                    <Typography variant="body2">{ctx.myRole === r ? (status === "locked" ? "Week locked" : st.past ? "Already passed" : "Not open yet") : "Not your role"}</Typography>
                  </Box>
                );
              }
              return (
                <Box key={r} sx={{ ...row, background: c.tint }}>
                  <Box component="span" sx={{ fontSize: 10, letterSpacing: "0.06em", fontWeight: 600, width: 22, color: c.deep }}>{c.short}</Box>
                  <Box sx={{ flex: 1 }}>{st.holderName}</Box>
                  <Typography variant="body2" color="text.secondary">{counts[holder!] ?? 0} this month</Typography>
                </Box>
              );
            })}
            {ctx.myRole && live.seats[ctx.myRole] === null && seatState(live, ctx.myRole, ctx).claimable && (
              <Box sx={{ p: "10px 12px", border: `1px solid ${T.rule}`, fontSize: 13, mt: 0.75, color: "rgba(29,31,32,0.75)" }}>
                Claiming makes this your {ordinal(myCount + 1)} shift in {format(parseISO(live.date), "MMMM")}. Team median is {teamMedian}.
              </Box>
            )}
          </Box>

          <Box sx={{ p: "4px 22px 16px", display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25 }}>Handed over to you</Typography>
            {prev?.handover ? (
              <Blueprint sx={{ p: "12px 14px", fontSize: 14, lineHeight: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                  {shiftShort(prev)} · {SEAT_ROLES.map((r) => prev.seats[r] && ctx.users[prev.seats[r]!]?.displayName).filter(Boolean).join(", ") || "no seat-holders"}
                </Typography>
                <Box sx={{ whiteSpace: "pre-wrap" }}>{prev.handover.text}</Box>
              </Blueprint>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
                {prev ? (seatState(prev, "fe", ctx).past ? "The previous shift left no note." : "The previous shift hasn't happened yet — its note appears here once it ends.") : "No earlier shift loaded."}
              </Typography>
            )}

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1.25, mb: 0.25 }}>{canEditNote ? "Your handover note" : "Handover note"}</Typography>
            {canEditNote ? (
              <>
                <TextField multiline minRows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`What's still open at ${SLOT_TIMES[live.slot].label.split(" – ")[1]}? Incidents, tickets, anything the next shift should watch…`} fullWidth />
                <Typography variant="caption" color="text.secondary">Editable by the three seat-holders until the week is locked.</Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: live.handover ? T.text : T.muted }}>{live.handover?.text ?? "No note yet."}</Typography>
            )}
          </Box>

          <Box sx={{ mt: "auto", p: "12px 22px 18px", borderTop: "1px solid rgba(29,31,32,0.12)", display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {iHold && (
              <Button
                variant="outlined"
                component="a"
                href={googleCalendarUrl(live, SEAT_ROLES.find((r) => live.seats[r] === ctx.uid)!, Object.fromEntries(Object.entries(ctx.users).map(([k, v]) => [k, v.displayName])))}
                target="_blank"
                rel="noopener"
                startIcon={<CalendarPlus size={14} strokeWidth={1.5} />}
                sx={{ mr: "auto" }}
              >
                Add to calendar
              </Button>
            )}
            <Button variant="outlined" onClick={onClose}>Close</Button>
            {canEditNote && (
              <Blueprint sx={{ border: "none" }}>
                <Button variant="contained" disabled={busy || note === (live.handover?.text ?? "")} onClick={() => run(() => saveHandover(live.id, ctx.uid, note), "Handover note saved")}>Save note</Button>
              </Blueprint>
            )}
          </Box>

          {ctx.myRole && (
            <SwapRequestDialog open={swapOpen} onClose={() => setSwapOpen(false)} giveShift={live} role={ctx.myRole} ctx={ctx} allShifts={allShifts} onDone={(msg) => { setSwapOpen(false); onToast(msg, "success"); }} onError={(msg) => onToast(msg, "error")} />
          )}
        </Box>
      )}
    </Drawer>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"] as const;
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
