"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { format } from "date-fns";
import { ROLE, T } from "@/lib/theme";
import { isSeatRole } from "@/lib/types";
import { firstName } from "@/lib/format";
import type { UsersMap } from "@/lib/hooks/useUsers";

/** Per-person shift count this month. Every rota shift is weekend or evening, so this is the fairness number. */
export function FairnessStrip({ users, counts, uid, month }: { users: UsersMap; counts: Record<string, number>; uid: string; month: Date }) {
  const people = Object.entries(users)
    .filter(([, u]) => isSeatRole(u.role))
    .sort(([, a], [, b]) => a.displayName.localeCompare(b.displayName));
  if (people.length === 0) return null;
  const high = Math.max(0, ...people.map(([id]) => counts[id] ?? 0));
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 0.75 }}>Weekend &amp; evening shifts · {format(month, "MMMM")}</Typography>
      {people.map(([id, u]) => {
        const c = ROLE[u.role as "fe"];
        const me = id === uid;
        const n = counts[id] ?? 0;
        return (
          <Box key={id} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, height: 24, pl: "6px", pr: "8px", border: `1px solid ${me ? c.fill : T.divider}`, background: me ? c.tint : "transparent", fontSize: 12, fontWeight: me ? 600 : 400 }}>
            <Box component="span" sx={{ width: 8, height: 8, background: c.fill }} />
            {me ? "You" : firstName(u.displayName)}
            <Box component="span" sx={{ fontFamily: T.fontHeading, fontWeight: 600, fontSize: 14, color: high > 0 && n >= high ? T.accent700 : T.text }}>{n}</Box>
          </Box>
        );
      })}
    </Box>
  );
}
