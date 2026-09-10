"use client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import { CalendarDays, TriangleAlert } from "lucide-react";
import { addDays, format } from "date-fns";
import { DAYS, DAY_LABEL, SLOTS, slotsForDay, weekStart } from "@/lib/template";
import { T } from "@/lib/theme";

/** The calendar frame every state keeps: heavy rule + seven ghost headers, so the page never jumps. */
function GhostFrame({ anchor, children }: { anchor: Date; children: React.ReactNode }) {
  const start = weekStart(anchor);
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderTop: `3px solid ${T.text}` }}>
      <Box />
      {DAYS.map((d, i) => (
        <Box key={d} sx={{ p: "8px 6px 6px", borderLeft: `1px solid ${T.rule}` }}>
          <Typography variant="subtitle2" sx={{ fontSize: 10, color: "rgba(29,31,32,0.5)" }}>{DAY_LABEL[d]}</Typography>
          <Typography sx={{ fontFamily: T.fontHeading, fontWeight: 600, fontSize: 24, lineHeight: 1.1, color: "rgba(29,31,32,0.4)" }}>{format(addDays(start, i), "d")}</Typography>
        </Box>
      ))}
      {children}
    </Box>
  );
}

export function BoardEmpty({ anchor, title, body, onBack }: { anchor: Date; title: string; body: string; onBack?: () => void }) {
  return (
    <GhostFrame anchor={anchor}>
      <Box sx={{ gridColumn: "1 / -1", height: 270, borderTop: `1px solid ${T.rule}`, display: "grid", placeItems: "center", background: "#ececee" }}>
        <Box sx={{ textAlign: "center", maxWidth: 300, px: 2 }}>
          <Box sx={{ width: 44, height: 44, border: `1px dashed ${T.n400}`, mx: "auto", mb: 1.5, display: "flex", alignItems: "center", justifyContent: "center", color: T.n600 }}>
            <CalendarDays size={20} strokeWidth={1.5} />
          </Box>
          <Typography variant="h3">{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.75 }}>{body}</Typography>
          {onBack && <Button variant="outlined" onClick={onBack}>Back to this week</Button>}
        </Box>
      </Box>
    </GhostFrame>
  );
}

export function BoardSkeleton({ anchor }: { anchor: Date }) {
  return (
    <GhostFrame anchor={anchor}>
      {SLOTS.map((slot) => (
        <Box key={slot} sx={{ display: "contents" }}>
          <Box sx={{ p: "8px 4px 0", borderTop: `1px solid ${T.rule}` }}><Skeleton variant="rectangular" width={40} height={9} /></Box>
          {DAYS.map((d) => {
            const on = slotsForDay(d).includes(slot);
            return (
              <Box key={d} sx={{ height: 90, borderTop: `1px solid ${T.rule}`, borderLeft: `1px solid ${T.rule}`, p: "6px 5px", display: "flex", flexDirection: "column", gap: 0.5, background: on ? "transparent" : "#ececee" }}>
                {on && [0, 1, 2].map((i) => <Skeleton key={i} variant="rectangular" height={20} />)}
              </Box>
            );
          })}
        </Box>
      ))}
    </GhostFrame>
  );
}

export function BoardErrorBanner({ at, onRetry }: { at: Date | null; onRetry: () => void }) {
  return (
    <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", border: `1px solid ${T.err}`, color: T.errDeep, p: "10px 12px", fontSize: 13 }}>
      <TriangleAlert size={16} strokeWidth={1.5} style={{ flex: "none" }} />
      <Box sx={{ flex: 1 }}>Couldn&apos;t refresh the rota{at ? ` — showing what loaded at ${format(at, "HH:mm")}` : ""}. Claims are paused until it reconnects.</Box>
      <Button variant="outlined" size="small" onClick={onRetry} sx={{ height: 30, color: T.text }}>Retry</Button>
    </Box>
  );
}
