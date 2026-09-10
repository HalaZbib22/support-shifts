"use client";
import Box from "@mui/material/Box";
import { ArrowLeftRight, Plus } from "lucide-react";
import { ROLE, T } from "@/lib/theme";
import { ROLE_LABEL, type SeatRole } from "@/lib/types";

export interface SeatState {
  role: SeatRole;
  holderName: string | null; // null = open
  isMine: boolean;
  claimable: boolean; // open + my role + week open + not past
  past: boolean;
  pending: boolean; // a swap involving this seat is pending
}

/** Visual grammar from the design: only "mine" is filled; only "claimable" invites. */
export function seatStyle(s: SeatState) {
  const c = ROLE[s.role];
  if (s.isMine) return { label: s.pending ? "You · swap pending" : "You", weight: 600, bg: c.fill, fg: "#fff", border: `1px solid ${c.fill}`, badge: "rgba(255,255,255,0.8)", plus: false };
  if (s.holderName === null && s.claimable) return { label: "Claim seat", weight: 600, bg: c.tint, fg: c.deep, border: `1.5px dashed ${c.fill}`, badge: c.deep, plus: true };
  if (s.holderName === null) return { label: s.past ? "Unfilled" : "Open", weight: 400, bg: "transparent", fg: T.n600, border: `1px dashed ${T.n400}`, badge: T.n500, plus: false };
  return { label: s.holderName, weight: 400, bg: c.tint, fg: T.text, border: "1px solid transparent", badge: c.deep, plus: false };
}

export function SeatToken({ seat, onClick, size = "board" }: { seat: SeatState; onClick: () => void; size?: "board" | "phone" }) {
  const st = seatStyle(seat);
  const c = ROLE[seat.role];
  const board = size === "board";
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={`${ROLE_LABEL[seat.role]} seat: ${st.label}`}
      sx={{
        all: "unset",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: board ? "7px" : 1,
        height: board ? 32 : 40,
        px: board ? 1 : 1.25,
        width: "100%",
        fontSize: board ? 13 : 14,
        fontWeight: st.weight,
        background: st.bg,
        color: st.fg,
        border: st.border,
        opacity: seat.past ? 0.55 : 1,
        cursor: "pointer",
        transition: "filter 120ms",
        "&:hover": { filter: "brightness(0.96)" },
        "&:active": { filter: "brightness(0.92)" },
        "&:focus-visible": { outline: `2px solid ${c.fill}`, outlineOffset: 2 },
      }}
    >
      <Box component="span" sx={{ fontSize: 10, letterSpacing: "0.06em", fontWeight: 600, color: st.badge, width: 20, flex: "none" }}>{c.short}</Box>
      {st.plus && <Plus size={13} strokeWidth={2} style={{ flex: "none" }} />}
      <Box component="span" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.label}</Box>
      {seat.pending && <ArrowLeftRight size={13} strokeWidth={1.5} style={{ flex: "none", opacity: 0.85 }} />}
    </Box>
  );
}
