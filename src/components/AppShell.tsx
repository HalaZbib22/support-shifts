"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ArrowLeftRight, CalendarPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Brand } from "./Brand";
import { Initials } from "./Initials";
import { Blueprint } from "./Blueprint";
import { CalendarDialog } from "./CalendarDialog";
import { useSwaps } from "@/lib/hooks/useSwaps";
import { T } from "@/lib/theme";
import { ROLE_LABEL } from "@/lib/types";

const Badge = ({ n }: { n: number }) =>
  n > 0 ? (
    <Box component="span" sx={{ minWidth: 18, height: 18, px: 0.6, background: T.accent, color: "#fff", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {n}
    </Box>
  ) : null;

function NavLink({ href, label, badge, current }: { href: string; label: string; badge?: number; current: boolean }) {
  return (
    <Box component={Link} href={href} aria-current={current ? "page" : undefined} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14, textDecoration: "none", color: current ? T.text : "rgba(29,31,32,0.6)", fontWeight: current ? 600 : 400, py: 0.5, borderBottom: current ? `2px solid ${T.accent}` : "2px solid transparent", "&:hover": { color: T.text } }}>
      {label}
      {badge !== undefined && <Badge n={badge} />}
    </Box>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, user, profile, signIn, signOutUser } = useAuth();
  const pathname = usePathname();
  const phone = useMediaQuery("(max-width:720px)");
  const { pendingIncoming } = useSwaps(user?.uid ?? null);
  const [menuEl, setMenuEl] = useState<null | HTMLElement>(null);
  const [calOpen, setCalOpen] = useState(false);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress size={22} sx={{ color: T.accent }} />
      </Box>
    );
  }

  if (!user) return <SignIn onSignIn={signIn} />;

  const links = [
    { href: "/", label: "Board" },
    { href: "/swaps", label: "Swaps", badge: pendingIncoming },
    ...(profile?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
    { href: "/payouts", label: "Payouts" },
  ];
  const name = profile?.displayName ?? user.displayName ?? "You";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", pb: phone ? "72px" : 0 }}>
      <Box component="header" sx={{ display: "flex", alignItems: "center", gap: 3, px: { xs: 2, sm: 3 }, py: 1.5, borderBottom: "1px solid rgba(29,31,32,0.12)" }}>
        <Box component={Link} href="/" sx={{ textDecoration: "none" }}><Brand size={phone ? 18 : 20} /></Box>
        {!phone && (
          <Box sx={{ display: "flex", gap: 2.5, ml: 1 }}>
            {links.map((l) => <NavLink key={l.href} {...l} current={pathname === l.href} />)}
          </Box>
        )}
        <Box sx={{ flex: 1 }} />
        <Box component="button" onClick={(e: React.MouseEvent<HTMLElement>) => setMenuEl(e.currentTarget)} sx={{ all: "unset", cursor: "pointer", display: "inline-flex" }} aria-label="Account">
          <Initials name={name} />
        </Box>
        <Menu anchorEl={menuEl} open={!!menuEl} onClose={() => setMenuEl(null)} slotProps={{ paper: { sx: { border: `1px solid ${T.divider}`, mt: 1, minWidth: 220 } } }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography sx={{ fontWeight: 500 }}>{name}</Typography>
            <Typography variant="body2" color="text.secondary">{profile?.role ? ROLE_LABEL[profile.role] : "No role yet"}{profile?.isAdmin ? " · Admin" : ""}</Typography>
          </Box>
          <MenuItem onClick={() => { setMenuEl(null); setCalOpen(true); }} sx={{ gap: 1.25 }}>
            <CalendarPlus size={15} strokeWidth={1.5} /> Add shifts to calendar
          </MenuItem>
          <MenuItem onClick={() => { setMenuEl(null); signOutUser(); }}>Sign out</MenuItem>
        </Menu>
        <CalendarDialog open={calOpen} onClose={() => setCalOpen(false)} uid={user.uid} token={profile?.calendarToken} />
      </Box>

      <Box component="main" sx={{ flex: 1 }}>{children}</Box>

      {phone && (
        <Box component="nav" sx={{ position: "fixed", left: 0, right: 0, bottom: 0, background: T.bg, borderTop: `1px solid ${T.rule}`, display: "grid", gridTemplateColumns: `repeat(${links.length}, 1fr)`, height: 64, pb: "env(safe-area-inset-bottom)", zIndex: 10 }}>
          {links.map((l) => {
            const cur = pathname === l.href;
            return (
              <Box key={l.href} component={Link} href={l.href} sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.4, fontSize: 11, textDecoration: "none", color: cur ? T.accent700 : "rgba(29,31,32,0.6)", fontWeight: cur ? 600 : 400, position: "relative" }}>
                {l.label === "Board" && <Box component="span" sx={{ width: 18, height: 14, border: "1.5px solid currentColor", borderTopWidth: 3 }} />}
                {l.label === "Swaps" && <ArrowLeftRight size={18} strokeWidth={1.5} />}
                {l.label === "Admin" && <Box component="span" sx={{ width: 16, height: 16, border: "1.5px solid currentColor" }} />}
                {l.label === "Payouts" && <Box component="span" sx={{ fontFamily: T.fontHeading, fontWeight: 600, fontSize: 16, lineHeight: "18px" }}>$</Box>}
                {l.label}
                {l.badge ? <Box component="span" sx={{ position: "absolute", top: 8, right: "calc(50% - 20px)", width: 16, height: 16, background: T.accent, color: "#fff", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{l.badge}</Box> : null}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

function SignIn({ onSignIn }: { onSignIn: () => Promise<void> }) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onSignIn();
    } catch (e) {
      setErr(e instanceof Error && /popup-closed|cancelled/.test(e.message) ? "Sign-in was cancelled." : "Google sign-in didn't complete. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", position: "relative", p: 2 }}>
      <Box sx={{ position: "absolute", top: 22, left: 26 }}><Brand /></Box>
      <Blueprint sx={{ width: 380, maxWidth: "100%", p: "28px 28px 24px" }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>Sign in</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Out-of-hours rota · claim, swap and hand over shifts</Typography>
        {err && (
          <Box sx={{ border: `1px solid ${T.err}`, color: T.errDeep, p: "10px 12px", fontSize: 13, mb: 2 }}>{err}</Box>
        )}
        <Blueprint component="div" sx={{ border: "none" }}>
          <Button fullWidth variant="contained" onClick={go} disabled={busy} sx={{ height: 40, fontSize: 15 }}>
            {busy ? "Opening Google…" : "Continue with Google"}
          </Button>
        </Blueprint>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ textAlign: "center", mt: 2 }}>
          Roles are assigned by an admin after your first sign-in.
        </Typography>
      </Blueprint>
    </Box>
  );
}
