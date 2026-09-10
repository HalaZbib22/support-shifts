"use client";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Lock, Plus } from "lucide-react";
import { addWeeks, endOfMonth, format, startOfMonth, subDays, subWeeks, parseISO } from "date-fns";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/PageHeader";
import { Blueprint } from "@/components/Blueprint";
import { Tag } from "@/components/Tag";
import { useToast } from "@/components/Toast";
import { db } from "@/lib/firebase";
import { useUsers } from "@/lib/hooks/useUsers";
import { useWeeks } from "@/lib/hooks/useWeeks";
import { useShifts } from "@/lib/hooks/useShifts";
import { createWeek, deleteWeek, setWeekStatus } from "@/lib/shifts";
import { monthCounts } from "@/lib/board";
import { weekIdFor, weekStart } from "@/lib/template";
import { weekRangeLabel, weekNumber, money } from "@/lib/format";
import { ROLE, T } from "@/lib/theme";
import { PAY_PER_SHIFT, ROLE_LABEL, SEAT_ROLES, type Role, type WeekStatus } from "@/lib/types";

const ROLES: Role[] = ["fe", "mobile", "be_l1", "be_l2"];

export default function AdminPage() {
  const { user, profile } = useAuth();
  const phone = useMediaQuery("(max-width:900px)");
  const now = useMemo(() => new Date(), []);
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const isAdmin = !!profile?.isAdmin;

  const users = useUsers(isAdmin);
  const weeks = useWeeks(isAdmin);
  const { shifts } = useShifts(format(subDays(subWeeks(startOfMonth(now), 2), 1), "yyyy-MM-dd"), format(addWeeks(endOfMonth(now), 4), "yyyy-MM-dd"), isAdmin);

  const counts = useMemo(() => monthCounts(shifts, weeks ?? {}, format(now, "yyyy-MM")), [shifts, weeks, now]);

  if (!isAdmin) {
    return (
      <Box sx={{ px: 3, pt: 4, maxWidth: 520, mx: "auto" }}>
        <Typography variant="h2">Admins only</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>This page manages roles and weeks. Ask an existing admin if you need access.</Typography>
      </Box>
    );
  }

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast.show(ok, "success");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Something went wrong", "error");
    } finally {
      setBusy(null);
    }
  };

  // Weeks to show: two back, four ahead, plus anything that already exists in range.
  const anchors = [-1, 0, 1, 2, 3].map((d) => addWeeks(weekStart(now), d));
  const existing = Object.keys(weeks ?? {});
  const cards = anchors
    .map((a) => ({ anchor: a, weekId: weekIdFor(a) }))
    .filter((c, i, arr) => arr.findIndex((x) => x.weekId === c.weekId) === i)
    .sort((a, b) => b.weekId.localeCompare(a.weekId));

  const roster = Object.entries(users).sort(([, a], [, b]) => a.displayName.localeCompare(b.displayName));
  const perRole = SEAT_ROLES.map((r) => roster.filter(([, u]) => u.role === r).length);

  return (
    <Box sx={{ px: phone ? 2 : 3, pt: 2.25, pb: 4, maxWidth: 1240, mx: "auto", display: "grid", gridTemplateColumns: phone ? "1fr" : "minmax(0,1fr) 360px", gap: 3.5 }}>
      <Box>
        <PageHeader
          title="Roster"
          sub={`${roster.length} people · ${perRole.join(" / ")} per seat role · 3 each keeps every seat fillable`}
        />
        {weeks === undefined ? (
          <Skeleton variant="rectangular" height={280} />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="center" sx={{ width: 70 }}>Admin</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Shifts · {format(now, "MMM")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roster.map(([uid, u]) => (
                <TableRow key={uid}>
                  <TableCell>
                    <Box sx={{ fontWeight: 500 }}>{u.displayName}</Box>
                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={u.role ?? null}
                      onChange={(_, v: Role | null) => run(`role-${uid}`, () => updateDoc(doc(db(), "users", uid), { role: v }), `${u.displayName}: ${v ? ROLE_LABEL[v] : "role cleared"}`)}
                      disabled={busy === `role-${uid}`}
                    >
                      {ROLES.map((r) => (
                        <ToggleButton key={r} value={r} sx={{ "&.Mui-selected": { background: r === "be_l2" ? T.n200 : ROLE[r as "fe"].tint, color: r === "be_l2" ? T.text : ROLE[r as "fe"].deep, fontWeight: 600, "&:hover": { background: r === "be_l2" ? T.n200 : ROLE[r as "fe"].tint } } }}>
                          {r === "be_l2" ? "L2" : ROLE[r as "fe"].short}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      size="small"
                      checked={u.isAdmin}
                      disabled={uid === user!.uid || busy === `admin-${uid}`}
                      onChange={(e) => run(`admin-${uid}`, () => updateDoc(doc(db(), "users", uid), { isAdmin: e.target.checked }), `${u.displayName}: ${e.target.checked ? "now an admin" : "admin removed"}`)}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: T.fontHeading, fontWeight: 600, fontSize: 18 }}>{counts[uid] ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      <Box>
        <Typography variant="h1" sx={{ mb: 1.5 }}>Weeks</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
          {cards.map(({ anchor, weekId }) => {
            const week = weeks?.[weekId];
            const ws = shifts.filter((s) => s.weekId === weekId);
            const filled = ws.reduce((n, s) => n + SEAT_ROLES.filter((r) => s.seats[r]).length, 0);
            const total = ws.length * 3;
            const openBy = SEAT_ROLES.map((r) => `${ws.filter((s) => !s.seats[r]).length} ${ROLE[r].short}`).join(", ");
            const label = `Week ${weekNumber(weekId)} · ${weekRangeLabel(anchor, false)}`;

            if (!week) {
              return (
                <Button key={weekId} variant="outlined" fullWidth disabled={busy === weekId} startIcon={<Plus size={14} strokeWidth={1.5} />} onClick={() => run(weekId, () => createWeek(anchor), `${label} created as a draft`)} sx={{ height: 40, borderStyle: "dashed" }}>
                  Create {label}
                </Button>
              );
            }
            return (
              <Blueprint key={weekId} sx={{ p: "14px 16px", opacity: week.status === "locked" ? 0.75 : 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
                  <Typography variant="h3">{label}</Typography>
                  <StatusTag status={week.status} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                  {week.status === "draft"
                    ? `${ws.length} shifts created, ${filled} of ${total} seats claimed. Not visible to the team yet.`
                    : week.status === "open"
                      ? `${filled} of ${total} seats claimed${filled < total ? ` · open: ${openBy}` : " · fully staffed"}.`
                      : `${filled} of ${total} seats · ${money(filled * PAY_PER_SHIFT)} counted in ${format(parseISO(week.startDate), "MMMM")} payouts.`}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {week.status === "draft" && (
                    <>
                      <Blueprint sx={{ border: "none" }}>
                        <Button variant="contained" disabled={busy === weekId} onClick={() => run(weekId, () => setWeekStatus(weekId, "open"), `${label} published`)}>Publish week</Button>
                      </Blueprint>
                      <Button disabled={busy === weekId} onClick={() => run(weekId, () => deleteWeek(weekId, ws.map((s) => s.id)), `${label} deleted`)}>Delete</Button>
                    </>
                  )}
                  {week.status === "open" && (
                    <Button variant="outlined" disabled={busy === weekId} startIcon={<Lock size={13} strokeWidth={1.5} />} onClick={() => run(weekId, () => setWeekStatus(weekId, "locked"), `${label} locked`)}>Lock now</Button>
                  )}
                  {week.status === "locked" && (
                    <Button disabled={busy === weekId} onClick={() => run(weekId, () => setWeekStatus(weekId, "open"), `${label} reopened`)}>Unlock</Button>
                  )}
                  <Button component={Link} href="/">View board</Button>
                </Box>
              </Blueprint>
            );
          })}
        </Box>
        {existing.length > cards.length && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            Older weeks stay in the payout totals; use the board&apos;s week arrows to look at them.
          </Typography>
        )}
      </Box>
      {toast.el}
    </Box>
  );
}

function StatusTag({ status }: { status: WeekStatus }) {
  if (status === "open") return <Tag variant="accent">Published</Tag>;
  if (status === "locked") return <Tag variant="neutral"><Lock size={11} strokeWidth={1.5} /> Locked</Tag>;
  return <Tag variant="neutral">Draft</Tag>;
}
