"use client";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ArrowLeftRight } from "lucide-react";
import { format, endOfMonth, startOfMonth, addWeeks, subDays } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/PageHeader";
import { Tag } from "@/components/Tag";
import { Blueprint } from "@/components/Blueprint";
import { useToast } from "@/components/Toast";
import { useUsers } from "@/lib/hooks/useUsers";
import { useShifts, type ShiftWithId } from "@/lib/hooks/useShifts";
import { useSwaps, type SwapWithId } from "@/lib/hooks/useSwaps";
import { acceptSwap, cancelSwap, declineSwap } from "@/lib/swaps";
import { shiftShort, shiftKind, firstName } from "@/lib/format";
import { ROLE, T } from "@/lib/theme";
import type { SwapStatus } from "@/lib/types";

const AGO = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} hours ago`;
  if (m < 60 * 48) return "Yesterday";
  return format(ms, "EEE d MMM");
};

const STATUS_LABEL: Record<SwapStatus, string> = { pending: "Pending", accepted: "Accepted", declined: "Declined", cancelled: "Cancelled" };

export default function SwapsPage() {
  const { user } = useAuth();
  const uid = user!.uid;
  const phone = useMediaQuery("(max-width:720px)");
  const now = useMemo(() => new Date(), []);
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const users = useUsers(true);
  const { shifts } = useShifts(format(subDays(startOfMonth(now), 1), "yyyy-MM-dd"), format(new Date(Math.max(+endOfMonth(now), +addWeeks(now, 6))), "yyyy-MM-dd"), true);
  const { incoming, outgoing } = useSwaps(uid);
  const byId = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);

  const pendingIn = incoming.filter((s) => s.status === "pending");
  const pendingOut = outgoing.filter((s) => s.status === "pending");
  const history = [...incoming, ...outgoing].filter((s) => s.status !== "pending");

  const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try {
      await fn();
      toast.show(ok, "success");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Couldn't update the swap", "error");
    } finally {
      setBusy(null);
    }
  };

  const shiftCell = (id: string, note?: string) => {
    const s = byId.get(id);
    if (!s) return <Typography variant="body2" color="text.secondary">Shift not loaded</Typography>;
    return (
      <>
        <Box sx={{ fontWeight: 600 }}>{shiftShort(s)}</Box>
        <Typography variant="caption" color="text.secondary">{shiftKind(s)}{note ? ` · ${note}` : ""}</Typography>
      </>
    );
  };

  const person = (id: string, when: number, role: SwapWithId["role"]) => (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 8, height: 8, background: ROLE[role].fill, flex: "none" }} />
        {users[id]?.displayName ?? "…"}
      </Box>
      <Typography variant="caption" color="text.secondary">{AGO(when)}</Typography>
    </>
  );

  const lists: { rows: SwapWithId[]; kind: "in" | "out" | "history" }[] = [
    { rows: pendingIn, kind: "in" },
    { rows: pendingOut, kind: "out" },
    { rows: history, kind: "history" },
  ];
  const current = lists[tab]!;

  return (
    <Box sx={{ px: phone ? 2 : 3, pt: 2.25, pb: 4, maxWidth: 1000, mx: "auto" }}>
      <PageHeader
        title="Swaps"
        sub="Same-role trades only, so every request is a straight swap of two seats."
        right={
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 40, borderBottom: `1px solid ${T.rule}` }}>
            <Tab label={`Incoming${pendingIn.length ? ` · ${pendingIn.length}` : ""}`} />
            <Tab label={`Outgoing${pendingOut.length ? ` · ${pendingOut.length}` : ""}`} />
            <Tab label="History" />
          </Tabs>
        }
      />

      {current.rows.length === 0 ? (
        <Blueprint sx={{ p: "40px 28px", textAlign: "center", maxWidth: 380, mx: "auto", mt: 4 }}>
          <Box sx={{ width: 44, height: 44, border: `1px dashed ${T.n400}`, mx: "auto", mb: 1.75, display: "flex", alignItems: "center", justifyContent: "center", color: T.n600 }}>
            <ArrowLeftRight size={20} strokeWidth={1.5} />
          </Box>
          <Typography variant="h3">{tab === 2 ? "No past swaps" : "No swap requests"}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Open one of your seats on the board and choose <i>Request swap</i> to ask a teammate in your role.
          </Typography>
        </Blueprint>
      ) : phone ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {current.rows.map((s) => {
            const other = current.kind === "in" ? s.fromUid : s.toUid;
            return (
              <Blueprint key={s.id} sx={{ p: 1.75 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1 }}>
                  <Box>{person(other, s.createdAt, s.role)}</Box>
                  {s.status !== "pending" && <Tag>{STATUS_LABEL[s.status]}</Tag>}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, fontSize: 14 }}>
                  <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{current.kind === "in" ? "They give you" : "You take"}</Typography>{shiftCell(current.kind === "in" ? s.giveShiftId : s.takeShiftId)}</Box>
                  <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{current.kind === "in" ? "They take from you" : "You give"}</Typography>{shiftCell(current.kind === "in" ? s.takeShiftId : s.giveShiftId)}</Box>
                </Box>
                {s.status === "pending" && (
                  <Box sx={{ display: "flex", gap: 1, mt: 1.5, justifyContent: "flex-end" }}>
                    {current.kind === "in" ? (
                      <>
                        <Button variant="outlined" size="small" disabled={busy === s.id} onClick={() => act(s.id, () => declineSwap(s.id), "Swap declined")}>Decline</Button>
                        <Button variant="contained" size="small" disabled={busy === s.id} onClick={() => act(s.id, () => acceptSwap(s.id, uid), "Swap accepted · seats moved")}>Accept</Button>
                      </>
                    ) : (
                      <Button size="small" disabled={busy === s.id} onClick={() => act(s.id, () => cancelSwap(s.id), "Request cancelled")}>Cancel request</Button>
                    )}
                  </Box>
                )}
              </Blueprint>
            );
          })}
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 170 }}>{current.kind === "in" ? "From" : current.kind === "out" ? "To" : "With"}</TableCell>
              <TableCell>{current.kind === "in" ? "They give you" : "You take"}</TableCell>
              <TableCell sx={{ width: 36 }} />
              <TableCell>{current.kind === "in" ? "They take from you" : "You give"}</TableCell>
              <TableCell align="right" sx={{ width: 220 }}>{current.kind === "history" ? "Outcome" : "Action"}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {current.rows.map((s) => {
              const mineIn = s.toUid === uid;
              const other = mineIn ? s.fromUid : s.toUid;
              const takeFirst = current.kind === "in" || (current.kind === "history" && mineIn);
              return (
                <TableRow key={s.id}>
                  <TableCell>{person(other, s.createdAt, s.role)}</TableCell>
                  <TableCell>{shiftCell(takeFirst ? s.giveShiftId : s.takeShiftId)}</TableCell>
                  <TableCell sx={{ color: T.muted }}><ArrowLeftRight size={16} strokeWidth={1.5} /></TableCell>
                  <TableCell>{shiftCell(takeFirst ? s.takeShiftId : s.giveShiftId)}</TableCell>
                  <TableCell align="right">
                    {s.status !== "pending" ? (
                      <Tag>{STATUS_LABEL[s.status]}</Tag>
                    ) : current.kind === "in" ? (
                      <Box sx={{ display: "inline-flex", gap: 0.75 }}>
                        <Button variant="outlined" size="small" disabled={busy === s.id} onClick={() => act(s.id, () => declineSwap(s.id), "Swap declined")} sx={{ height: 32 }}>Decline</Button>
                        <Blueprint sx={{ border: "none" }}>
                          <Button variant="contained" size="small" disabled={busy === s.id} onClick={() => act(s.id, () => acceptSwap(s.id, uid), "Swap accepted · seats moved")} sx={{ height: 32 }}>Accept</Button>
                        </Blueprint>
                      </Box>
                    ) : (
                      <Box sx={{ display: "inline-flex", gap: 1.25, alignItems: "center" }}>
                        <Tag>Awaiting {firstName(users[s.toUid]?.displayName ?? "them")}</Tag>
                        <Button size="small" disabled={busy === s.id} onClick={() => act(s.id, () => cancelSwap(s.id), "Request cancelled")} sx={{ height: 32 }}>Cancel</Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {toast.el}
    </Box>
  );
}
