"use client";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useState, useCallback } from "react";
import { T } from "@/lib/theme";

export type Severity = "success" | "error";

export function useToast() {
  const [toast, setToast] = useState<{ msg: string; severity: Severity } | null>(null);
  const show = useCallback((msg: string, severity: Severity) => setToast({ msg, severity }), []);
  const el = (
    <Snackbar open={!!toast} autoHideDuration={3200} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
      <Alert severity={toast?.severity} variant="filled" onClose={() => setToast(null)} sx={{ background: toast?.severity === "error" ? T.err : T.toast, color: T.text, "& .MuiAlert-icon": { color: T.text } }}>
        {toast?.msg}
      </Alert>
    </Snackbar>
  );
  return { show, el };
}
