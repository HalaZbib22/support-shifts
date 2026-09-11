"use client";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Blueprint } from "./Blueprint";
import { feedUrl, googleSubscribeUrl, newCalendarToken, setCalendarToken, webcalUrl } from "@/lib/calendar";
import { T } from "@/lib/theme";

/** Personal subscription feed: one URL per person, kept live as they claim, swap and release. */
export function CalendarDialog({ open, onClose, uid, token }: { open: boolean; onClose: () => void; uid: string; token?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mint a token the first time someone opens this.
  useEffect(() => {
    if (!open || token) return;
    setBusy(true);
    setCalendarToken(uid, newCalendarToken())
      .catch(() => setError("Couldn't create your feed link. Try again."))
      .finally(() => setBusy(false));
  }, [open, token, uid]);

  const url = token ? feedUrl(token) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the text and copy manually.");
    }
  };

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      await setCalendarToken(uid, newCalendarToken());
    } catch {
      setError("Couldn't reset the link. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box sx={{ p: "20px 22px 16px", borderBottom: "1px solid ${T.edge}" }}>
        <Typography variant="h3">Your shifts in Google Calendar</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Subscribe once and the shifts you hold appear automatically — including when you swap or release one.
        </Typography>
      </Box>

      <Box sx={{ p: "16px 22px", display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Blueprint sx={{ border: "none" }}>
            <Button
              variant="contained"
              component="a"
              href={token ? googleSubscribeUrl(token) : undefined}
              target="_blank"
              rel="noopener"
              disabled={!token}
              startIcon={<ExternalLink size={14} strokeWidth={1.5} />}
              sx={{ height: 38 }}
            >
              Add to Google Calendar
            </Button>
          </Blueprint>
          <Button
            variant="outlined"
            component="a"
            href={token ? webcalUrl(token) : undefined}
            disabled={!token}
            sx={{ height: 38 }}
          >
            Open in Apple Calendar
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Google opens an &ldquo;Add calendar?&rdquo; prompt — confirm it and you&apos;re done. If that doesn&apos;t work, add the link by hand instead:
        </Typography>
        <TextField
          value={busy && !token ? "Creating your link…" : url}
          slotProps={{ input: { readOnly: true, sx: { fontSize: 13, fontFamily: "ui-monospace, SFMono-Regular, monospace" } } }}
          fullWidth
          onFocus={(e) => e.target.select()}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Blueprint sx={{ border: "none" }}>
            <Button variant="contained" onClick={copy} disabled={!token} startIcon={copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.5} />}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </Blueprint>
          <Button onClick={reset} disabled={busy}>Reset link</Button>
        </Box>
        {error && <Typography variant="body2" sx={{ color: T.errDeep }}>{error}</Typography>}

        <Blueprint sx={{ p: "12px 14px", mt: 0.5 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>Adding the link by hand</Typography>
          <Box component="ol" sx={{ m: 0, pl: 2, fontSize: 13, lineHeight: 1.7 }}>
            <li>Open Google Calendar on desktop (this can&apos;t be done from the phone app).</li>
            <li>Left sidebar → <b>Other calendars</b> → <b>+</b> → <b>From URL</b>.</li>
            <li>Paste the link above and click <b>Add calendar</b>.</li>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Google re-checks subscribed calendars on its own schedule, often several hours apart, so a seat you just claimed may take a while to show up. The board is always current.
          </Typography>
        </Blueprint>

        <Typography variant="caption" color="text.secondary">
          Anyone with this link can see your shifts, so keep it to yourself. Reset it if you paste it somewhere public — the old link stops working immediately.
        </Typography>
      </Box>

      <Box sx={{ p: "12px 22px 18px", borderTop: "1px solid ${T.edge}", display: "flex", justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onClose}>Done</Button>
      </Box>
    </Dialog>
  );
}
