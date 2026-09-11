"use client";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import { ArrowLeftRight } from "lucide-react";
import { shiftShort, shiftKind, isPastShift } from "@/lib/format";
import { byTime, type BoardCtx } from "@/lib/board";
import { ROLE, T } from "@/lib/theme";
import type { SeatRole } from "@/lib/types";
import { requestSwap } from "@/lib/swaps";
import type { ShiftWithId } from "@/lib/hooks/useShifts";
import { Blueprint } from "../Blueprint";

interface Props {
  open: boolean;
  onClose: () => void;
  giveShift: ShiftWithId;
  role: SeatRole;
  ctx: BoardCtx;
  allShifts: ShiftWithId[];
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}

/** Pick one of a same-role teammate's seats to trade for the seat you hold. */
export function SwapRequestDialog({ open, onClose, giveShift, role, ctx, allShifts, onDone, onError }: Props) {
  const [pick, setPick] = useState<ShiftWithId | null>(null);
  const [busy, setBusy] = useState(false);
  const c = ROLE[role];

  const options = useMemo(
    () =>
      allShifts
        .filter((s) => s.id !== giveShift.id && s.seats[role] && s.seats[role] !== ctx.uid && ctx.weeks[s.weekId]?.status === "open" && !isPastShift(s, ctx.now))
        .filter((s) => !ctx.swaps.some((w) => w.status === "pending" && (w.giveShiftId === s.id || w.takeShiftId === s.id)))
        .sort(byTime),
    [allShifts, giveShift.id, role, ctx],
  );

  const send = async () => {
    if (!pick) return;
    setBusy(true);
    try {
      await requestSwap({ role, fromUid: ctx.uid, toUid: pick.seats[role]!, giveShiftId: giveShift.id, takeShiftId: pick.id });
      onDone(`Swap requested with ${ctx.users[pick.seats[role]!]?.displayName ?? "teammate"}`);
      setPick(null);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Couldn't send the request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <Box sx={{ p: "20px 22px 16px", borderBottom: "1px solid ${T.edge}" }}>
        <Typography variant="h3">Request a swap</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          You give <b>{shiftShort(giveShift)}</b> and take one of a teammate&apos;s {c.short} seats. They accept or decline.
        </Typography>
      </Box>
      <Box sx={{ p: "12px 22px", display: "flex", flexDirection: "column", gap: 0.75, maxHeight: 360, overflow: "auto" }}>
        {options.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No teammate in your role holds a seat in a published week right now.</Typography>}
        {options.map((s) => {
          const sel = pick?.id === s.id;
          const name = ctx.users[s.seats[role]!]?.displayName ?? "…";
          return (
            <Box key={s.id} component="button" type="button" onClick={() => setPick(s)} sx={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 1.25, px: 1.5, minHeight: 48, border: `1px solid ${sel ? c.fill : T.divider}`, background: sel ? c.tint : "transparent", "&:hover": { background: c.tint } }}>
              <ArrowLeftRight size={14} strokeWidth={1.5} style={{ color: T.muted, flex: "none" }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ fontWeight: 600, fontSize: 14 }}>{shiftShort(s)}</Box>
                <Typography variant="caption" color="text.secondary">{shiftKind(s)} · {name}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ p: "12px 22px 18px", borderTop: "1px solid ${T.edge}", display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Blueprint sx={{ border: "none" }}>
          <Button variant="contained" disabled={!pick || busy} onClick={send}>Send request</Button>
        </Blueprint>
      </Box>
    </Dialog>
  );
}
