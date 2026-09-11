"use client";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { addDays, addWeeks, endOfMonth, format, startOfMonth, subDays } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { Tag } from "@/components/Tag";
import { useToast } from "@/components/Toast";
import { DesktopBoard } from "@/components/board/DesktopBoard";
import { PhoneBoard } from "@/components/board/PhoneBoard";
import { ShiftDrawer } from "@/components/board/ShiftDrawer";
import { FairnessStrip } from "@/components/board/FairnessStrip";
import { MyShifts } from "@/components/MyShifts";
import { BoardEmpty, BoardSkeleton, BoardErrorBanner } from "@/components/board/BoardStates";
import { useUsers } from "@/lib/hooks/useUsers";
import { useWeeks } from "@/lib/hooks/useWeeks";
import { useShifts, type ShiftWithId } from "@/lib/hooks/useShifts";
import { useSwaps } from "@/lib/hooks/useSwaps";
import { weekIdFor, weekStart } from "@/lib/template";
import { weekRangeLabel, weekTitle } from "@/lib/format";
import { monthCounts, openForMe, type BoardCtx } from "@/lib/board";
import { ROLE, T } from "@/lib/theme";
import { isSeatRole, PAY_PER_SHIFT } from "@/lib/types";

export default function BoardPage() {
  const { user, profile } = useAuth();
  const uid = user!.uid;
  const phone = useMediaQuery("(max-width:720px)");
  const now = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(now);
  const toast = useToast();
  const [openShift, setOpenShift] = useState<ShiftWithId | null>(null);

  const weekId = weekIdFor(anchor);
  const start = weekStart(anchor);
  // Window: this month (for fairness), the shown week, and a few weeks ahead (for swap options).
  const from = format(subDays(new Date(Math.min(+startOfMonth(now), +start)), 1), "yyyy-MM-dd");
  const to = format(new Date(Math.max(+endOfMonth(now), +addDays(start, 6), +addWeeks(start, 5))), "yyyy-MM-dd");

  const users = useUsers(true);
  const weeks = useWeeks(true);
  const { shifts, loading, error, lastGoodAt, retry } = useShifts(from, to, true);
  const { incoming, outgoing } = useSwaps(uid);

  const myRole = isSeatRole(profile?.role) ? profile.role : null;
  const ctx: BoardCtx = useMemo(
    () => ({ uid, myRole, users, weeks: weeks ?? {}, swaps: [...incoming, ...outgoing], now, paused: !!error }),
    [uid, myRole, users, weeks, incoming, outgoing, now, error],
  );
  const week = weeks?.[weekId];
  const weekShifts = shifts.filter((s) => s.weekId === weekId);
  const counts = useMemo(() => monthCounts(shifts, weeks ?? {}, format(now, "yyyy-MM")), [shifts, weeks, now]);
  const open = openForMe(weekShifts, ctx);
  const ready = weeks !== undefined && !loading;
  const pad = phone ? 2 : 3;

  return (
    <Box sx={{ px: pad, pt: phone ? 1.5 : 2.25, pb: 3, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: phone ? 1 : 2.25, flexWrap: "wrap", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          {!phone && <NavBtn dir="prev" onClick={() => setAnchor(addWeeks(start, -1))} />}
          <Box>
            <Typography variant="h1" sx={{ fontSize: phone ? 32 : 42 }}>{weekTitle(anchor)}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {weekRangeLabel(anchor, !phone)}
              {phone && myRole && <> · <Box component="span" sx={{ color: T.accent700 }}>{open} open {ROLE[myRole].short} seats</Box></>}
            </Typography>
          </Box>
          {!phone && <NavBtn dir="next" onClick={() => setAnchor(addWeeks(start, 1))} />}
          {!phone && week?.status === "locked" && <Tag variant="neutral"><Lock size={12} strokeWidth={1.5} /> Locked</Tag>}
          {!phone && week?.status === "open" && <Tag variant="accent">Published · open for claims</Tag>}
          {!phone && week?.status === "draft" && <Tag variant="neutral">Draft · not visible yet</Tag>}
        </Box>
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
          {!phone && myRole && <Typography variant="body2"><b>{open}</b> <Box component="span" color="text.secondary">open {ROLE[myRole].short} seats this week</Box></Typography>}
          {phone ? (
            <>
              <NavBtn dir="prev" onClick={() => setAnchor(addWeeks(start, -1))} />
              <NavBtn dir="next" onClick={() => setAnchor(addWeeks(start, 1))} />
            </>
          ) : (
            <Button variant="outlined" onClick={() => setAnchor(now)} sx={{ height: 34 }}>Today</Button>
          )}
        </Box>
      </Box>

      {!phone && Object.keys(users).length > 0 && (
        <Box sx={{ pt: 0.5, pb: 1.75 }}>
          <FairnessStrip users={users} counts={counts} uid={uid} month={now} />
        </Box>
      )}

      <MyShifts shifts={shifts} weeks={weeks ?? {}} users={users} uid={uid} now={now} onOpen={setOpenShift} />

      {/* Notices */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1.5 }}>
        {error && <BoardErrorBanner at={lastGoodAt} onRetry={retry} />}
        {!profile?.role && <Notice>You don&apos;t have a role yet, so the board is read-only. An admin sets roles from the Admin page.</Notice>}
        {profile?.role === "be_l2" && <Notice>Backend L2 is escalation-only and isn&apos;t scheduled, so the board is read-only for you.</Notice>}
        {week?.status === "locked" && <Notice icon={<Lock size={15} strokeWidth={1.5} />}>This week is locked for payout. Seats can&apos;t be claimed, released or swapped — ask an admin if something&apos;s wrong.</Notice>}
        {week?.status === "draft" && profile?.isAdmin && <Notice>This week is a draft. Only admins can see it until it&apos;s published.</Notice>}
      </Box>

      {/* Board */}
      {!ready ? (
        <BoardSkeleton anchor={anchor} />
      ) : !week || (week.status === "draft" && !profile?.isAdmin) ? (
        <BoardEmpty anchor={anchor} title="Nothing to claim yet" body={`${weekTitle(anchor)} hasn't been published. Check back once an admin opens it.`} onBack={weekId !== weekIdFor(now) ? () => setAnchor(now) : undefined} />
      ) : phone ? (
        <PhoneBoard key={weekId} anchor={anchor} shifts={weekShifts} ctx={ctx} onOpen={setOpenShift} />
      ) : (
        <>
          <DesktopBoard anchor={anchor} shifts={weekShifts} ctx={ctx} onOpen={setOpenShift} />
          <Legend myRole={myRole} />
        </>
      )}

      <ShiftDrawer shift={openShift} allShifts={shifts} ctx={ctx} counts={counts} onClose={() => setOpenShift(null)} onToast={toast.show} />
      {toast.el}
    </Box>
  );
}

function NavBtn({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <IconButton onClick={onClick} aria-label={dir === "prev" ? "Previous week" : "Next week"} sx={{ width: 34, height: 34, border: `1px solid ${T.text}`, borderRadius: 0, color: T.text, "&:hover": { background: "rgba(29,31,32,0.06)" } }}>
      {dir === "prev" ? <ChevronLeft size={16} strokeWidth={1.5} /> : <ChevronRight size={16} strokeWidth={1.5} />}
    </IconButton>
  );
}

function Notice({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Box sx={{ p: "9px 12px", border: "1px solid rgba(29,31,32,0.25)", background: T.surface, fontSize: 13, display: "flex", gap: 1.25, alignItems: "center" }}>
      {icon}
      <span>{children}</span>
    </Box>
  );
}

function Legend({ myRole }: { myRole: "fe" | "mobile" | "be_l1" | null }) {
  const c = ROLE[myRole ?? "fe"];
  const item = (swatch: React.ReactNode, label: string) => (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>{swatch}{label}</Box>
  );
  return (
    <Box sx={{ display: "flex", gap: 2.25, mt: 1.5, fontSize: 12, color: "rgba(29,31,32,0.65)", flexWrap: "wrap", alignItems: "center" }}>
      {myRole && item(<Box sx={{ width: 22, height: 12, border: `1.5px dashed ${c.fill}`, background: c.tint }} />, "Open for you")}
      {myRole && item(<Box sx={{ width: 22, height: 12, background: c.fill }} />, "Your seat")}
      {item(<Box sx={{ width: 22, height: 12, background: ROLE.mobile.tint }} />, "Someone else")}
      {item(<Box sx={{ width: 22, height: 12, border: `1px dashed ${T.n400}` }} />, "Open, other role")}
      <Box component="span" sx={{ ml: "auto" }}>${PAY_PER_SHIFT} per shift · 11 shifts · 33 seats a week</Box>
    </Box>
  );
}
