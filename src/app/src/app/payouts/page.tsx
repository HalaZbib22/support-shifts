"use client";
import { useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/PageHeader";
import { Blueprint } from "@/components/Blueprint";
import { useUsers } from "@/lib/hooks/useUsers";
import { useWeeks } from "@/lib/hooks/useWeeks";
import { useShifts } from "@/lib/hooks/useShifts";
import { money } from "@/lib/format";
import { ROLE, T } from "@/lib/theme";
import { isSeatRole, PAY_PER_SHIFT, SEAT_ROLES } from "@/lib/types";

const MONTHS_BACK = 3;

export default function PayoutsPage() {
  const { user, profile } = useAuth();
  const phone = useMediaQuery("(max-width:900px)");
  const now = useMemo(() => new Date(), []);
  const months = useMemo(() => Array.from({ length: MONTHS_BACK + 1 }, (_, i) => startOfMonth(subMonths(now, MONTHS_BACK - i))), [now]);

  const users = useUsers(true);
  const weeks = useWeeks(true);
  const { shifts, loading } = useShifts(format(subDays(months[0]!, 7), "yyyy-MM-dd"), format(endOfMonth(now), "yyyy-MM-dd"), true);

  /** Only locked weeks are payable; seats in published-but-unlocked weeks are "pending". */
  const rows = useMemo(() => {
    const people = Object.entries(users).filter(([, u]) => isSeatRole(u.role));
    const paid: Record<string, Record<string, number>> = {};
    const pending: Record<string, number> = {};
    for (const s of shifts) {
      const status = weeks?.[s.weekId]?.status;
      if (!status || status === "draft") continue;
      const key = s.date.slice(0, 7);
      for (const r of SEAT_ROLES) {
        const uid = s.seats[r];
        if (!uid) continue;
        if (status === "locked") {
          paid[uid] ??= {};
          paid[uid]![key] = (paid[uid]![key] ?? 0) + 1;
        } else {
          pending[uid] = (pending[uid] ?? 0) + 1;
        }
      }
    }
    return people
      .map(([uid, u]) => ({ uid, name: u.displayName, role: u.role as "fe", byMonth: months.map((m) => paid[uid]?.[format(m, "yyyy-MM")] ?? 0), pending: pending[uid] ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, shifts, weeks, months]);

  const totals = months.map((_, i) => rows.reduce((n, r) => n + r.byMonth[i]!, 0));
  const pendingTotal = rows.reduce((n, r) => n + r.pending, 0);
  const visible = profile?.isAdmin ? rows : rows.filter((r) => r.uid === user!.uid);

  const exportCsv = () => {
    const head = ["Person", "Role", ...months.map((m) => format(m, "MMM yyyy")), "Pending"];
    const body = visible.map((r) => [r.name, ROLE[r.role].short, ...r.byMonth.map((n) => n * PAY_PER_SHIFT), r.pending * PAY_PER_SHIFT]);
    const csv = [head, ...body].map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `support-shift-payouts-${format(now, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ px: phone ? 2 : 3, pt: 2.25, pb: 4, maxWidth: 1000, mx: "auto" }}>
      <PageHeader
        title="Payouts"
        sub={`${money(PAY_PER_SHIFT)} per shift per person · locked weeks only`}
        right={<Button variant="outlined" onClick={exportCsv} disabled={visible.length === 0}>Export CSV</Button>}
      />

      {loading || weeks === undefined ? (
        <Skeleton variant="rectangular" height={320} />
      ) : visible.length === 0 ? (
        <Blueprint sx={{ p: "36px 28px", textAlign: "center", maxWidth: 380, mx: "auto", mt: 4 }}>
          <Typography variant="h3">Nothing to show yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Payouts appear here once you hold seats in a week an admin has locked.</Typography>
        </Blueprint>
      ) : phone ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {visible.map((r) => (
            <Blueprint key={r.uid} sx={{ p: 1.75 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, background: ROLE[r.role].fill }} />
                <Box sx={{ fontWeight: 600, flex: 1 }}>{r.name}</Box>
                <Typography sx={{ fontFamily: T.fontHeading, fontWeight: 600, fontSize: 20 }}>{money(r.byMonth[months.length - 1]! * PAY_PER_SHIFT)}</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2, fontSize: 13, color: T.muted, flexWrap: "wrap" }}>
                {months.slice(0, -1).map((m, i) => <span key={i}>{format(m, "MMM")} {money(r.byMonth[i]! * PAY_PER_SHIFT)}</span>)}
                {r.pending > 0 && <span>Pending {money(r.pending * PAY_PER_SHIFT)}</span>}
              </Box>
            </Blueprint>
          ))}
        </Box>
      ) : (
        <Table sx={{ fontVariantNumeric: "tabular-nums" }}>
          <TableHead>
            <TableRow>
              <TableCell>Person</TableCell>
              <TableCell sx={{ width: 70 }}>Role</TableCell>
              {months.map((m, i) => (
                <TableCell key={i} align="right" sx={{ color: i === months.length - 1 ? `${T.text} !important` : undefined }}>
                  {format(m, "MMM")}{i === months.length - 1 ? " · to date" : ""}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ color: `${T.muted45} !important` }}>Pending</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((r) => (
              <TableRow key={r.uid}>
                <TableCell sx={{ fontWeight: 500 }}>{r.name}</TableCell>
                <TableCell>
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 12 }}>
                    <Box component="span" sx={{ width: 8, height: 8, background: ROLE[r.role].fill }} />
                    {ROLE[r.role].short}
                  </Box>
                </TableCell>
                {r.byMonth.map((n, i) =>
                  i === months.length - 1 ? (
                    <TableCell key={i} align="right" sx={{ fontFamily: T.fontHeading, fontWeight: 600, fontSize: 18 }}>
                      {money(n * PAY_PER_SHIFT)}
                      <Box component="span" sx={{ fontFamily: T.fontBody, fontWeight: 400, fontSize: 11, ml: 0.75, color: T.muted }}>{n} {n === 1 ? "shift" : "shifts"}</Box>
                    </TableCell>
                  ) : (
                    <TableCell key={i} align="right">{money(n * PAY_PER_SHIFT)}</TableCell>
                  ),
                )}
                <TableCell align="right" sx={{ color: T.muted45 }}>{r.pending ? `+${money(r.pending * PAY_PER_SHIFT)}` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {profile?.isAdmin && (
            <TableFooter>
              <TableRow sx={{ "& td": { borderTop: `2px solid ${T.text}`, borderBottom: "none", color: T.text } }}>
                <TableCell sx={{ fontWeight: 600 }}>Team total</TableCell>
                <TableCell />
                {totals.map((n, i) => (
                  <TableCell key={i} align="right" sx={i === months.length - 1 ? { fontFamily: T.fontHeading, fontWeight: 600, fontSize: 20 } : undefined}>{money(n * PAY_PER_SHIFT)}</TableCell>
                ))}
                <TableCell align="right" sx={{ color: T.muted45 }}>{pendingTotal ? `+${money(pendingTotal * PAY_PER_SHIFT)}` : "—"}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
        Pending = seats held in published weeks an admin hasn&apos;t locked yet. A month of four full weeks pays {money(4 * 33 * PAY_PER_SHIFT)} across the team.
      </Typography>
    </Box>
  );
}
