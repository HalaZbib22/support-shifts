"use client";
import { createTheme } from "@mui/material/styles";
import type { SeatRole } from "./types";

/* Industry design system tokens (from the Claude Design export) */
export const T = {
  bg: "#f2f2f3",
  surface: "#e9e9ea",
  text: "#1d1f20",
  accent: "#5980a6",
  accent700: "#416180",
  accent800: "#2c455d",
  divider: "rgba(29,31,32,0.16)",
  rule: "rgba(29,31,32,0.14)",
  muted: "rgba(29,31,32,0.55)",
  n100: "#f5f5f8",
  n200: "#e7e7ea",
  n300: "#d4d4d7",
  n400: "#b7b7ba",
  n500: "#98989b",
  n600: "#7a7a7d",
  err: "#bd413f",
  errDeep: "#892122",
  fontHeading: '"Barlow Condensed", system-ui, sans-serif',
  fontBody: '"Barlow", system-ui, sans-serif',
} as const;

/* Role hues: OKLCH ramps from the design, pre-converted to hex for MUI. */
export const ROLE: Record<SeatRole, { short: string; fill: string; deep: string; mid: string; tint: string }> = {
  fe: { short: "FE", fill: "#00736f", deep: "#004a46", mid: "#58b7b1", tint: "#def6f4" },
  mobile: { short: "MO", fill: "#724aab", deep: "#492676", mid: "#b49ce1", tint: "#f2edff" },
  be_l1: { short: "BE", fill: "#915c08", deep: "#603800", mid: "#d6a866", tint: "#feefdc" },
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: T.accent, dark: T.accent700, contrastText: "#fff" },
    error: { main: T.err, dark: T.errDeep },
    background: { default: T.bg, paper: T.bg },
    text: { primary: T.text, secondary: T.muted },
    divider: T.divider,
  },
  shape: { borderRadius: 0 },
  typography: {
    fontFamily: T.fontBody,
    fontSize: 15,
    h1: { fontFamily: T.fontHeading, fontWeight: 600, fontSize: 42, lineHeight: 1, letterSpacing: "-0.015em" },
    h2: { fontFamily: T.fontHeading, fontWeight: 600, fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.015em" },
    h3: { fontFamily: T.fontHeading, fontWeight: 600, fontSize: 20, lineHeight: 1.12 },
    subtitle2: { fontFamily: T.fontBody, fontWeight: 500, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" },
    body1: { fontSize: 15, lineHeight: 1.55 },
    body2: { fontSize: 13, lineHeight: 1.5 },
    caption: { fontSize: 11, lineHeight: 1.4 },
    button: { fontFamily: T.fontHeading, fontWeight: 600, fontSize: 14, textTransform: "none" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
      styleOverrides: {
        root: { borderRadius: 0, minHeight: 34, padding: "6px 12px", "&:focus-visible": { outline: `2px solid ${T.accent}`, outlineOffset: 2 } },
        outlined: { borderColor: T.text, color: T.text, "&:hover": { background: "rgba(29,31,32,0.06)", borderColor: T.text } },
        contained: { "&:hover": { background: T.accent700 } },
        text: { color: T.text, "&:hover": { background: "rgba(29,31,32,0.06)" } },
      },
    },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${T.rule}`, padding: "10px 7px", fontSize: 14 },
        head: { fontFamily: T.fontBody, fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, borderBottom: `1px solid ${T.text}` },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 0, height: 24, fontSize: 12 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 0, background: "#fff", "& fieldset": { borderColor: T.divider }, "&:hover fieldset": { borderColor: T.text }, "&.Mui-focused fieldset": { borderWidth: 1, borderColor: T.accent } },
      },
    },
    MuiToggleButton: {
      styleOverrides: { root: { borderRadius: 0, textTransform: "none", fontFamily: T.fontBody, fontSize: 12, padding: "4px 10px", borderColor: T.divider, color: T.text } },
    },
    MuiDrawer: { styleOverrides: { paper: { background: T.bg, borderLeft: `1px solid ${T.divider}` } } },
    MuiDialog: { styleOverrides: { paper: { background: T.bg, border: `1px solid ${T.divider}` } } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontFamily: T.fontBody, fontSize: 14, minHeight: 40, padding: "8px 14px" } } },
    MuiTabs: { styleOverrides: { indicator: { height: 2, background: T.accent } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 0 } } },
    MuiSkeleton: { styleOverrides: { root: { background: "#e3e3e5", borderRadius: 0 } } },
    MuiCssBaseline: {
      styleOverrides: {
        "*:focus-visible": { outline: `2px solid ${T.accent}`, outlineOffset: 2 },
        "::selection": { background: "rgba(89,128,166,0.3)" },
      },
    },
  },
});
