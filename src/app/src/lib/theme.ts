"use client";
import { createTheme, type Theme } from "@mui/material/styles";
import type { SeatRole } from "./types";

export type Mode = "light" | "dark";

/**
 * Tokens are emitted as CSS custom properties and read through `T`, so switching
 * mode is one attribute flip on <html> rather than a re-render of every component.
 * Both palettes live in the same OKLCH space, so the dark one is a systematic
 * inversion of the light one rather than a separate set of hand-picked colours.
 */
const TOKENS = {
  light: {
    bg: "#f2f2f3",
    surface: "#e9e9ea",
    raised: "#ffffff",
    text: "#1d1f20",
    accent: "#5980a6",
    accent700: "#416180",
    accent800: "#2c455d",
    accentSoft: "#d6ebff",
    divider: "rgba(29,31,32,0.16)",
    rule: "rgba(29,31,32,0.14)",
    hairline: "rgba(29,31,32,0.06)",
    edge: "rgba(29,31,32,0.12)",
    muted: "rgba(29,31,32,0.55)",
    muted70: "rgba(29,31,32,0.75)",
    muted60: "rgba(29,31,32,0.60)",
    muted45: "rgba(29,31,32,0.45)",
    muted38: "rgba(29,31,32,0.38)",
    mark: "rgba(29,31,32,0.30)",
    hover: "rgba(29,31,32,0.06)",
    off: "#ececee", // uncovered "office hours" cells
    skeleton: "#e3e3e5",
    onFill: "#ffffff",
    onFillSoft: "rgba(255,255,255,0.80)",
    onFillLine: "rgba(255,255,255,0.55)",
    n100: "#f5f5f8", n200: "#e7e7ea", n300: "#d4d4d7",
    n400: "#8a8c90", n500: "#98989b", n600: "#6d6f72", // n400 clears 3:1 for borders
    err: "#bd413f",
    errDeep: "#892122",
    toast: "#1d1f20",
  },
  dark: {
    bg: "#151719",
    surface: "#212326",
    raised: "#1c1e21",
    text: "#ebedef",
    accent: "#77a4ca",
    accent700: "#9bbdda",
    accent800: "#c3d8ea",
    accentSoft: "#2d4b64",
    divider: "rgba(235,237,239,0.20)",
    rule: "rgba(235,237,239,0.16)",
    hairline: "rgba(235,237,239,0.07)",
    edge: "rgba(235,237,239,0.14)",
    muted: "rgba(235,237,239,0.58)",
    muted70: "rgba(235,237,239,0.78)",
    muted60: "rgba(235,237,239,0.62)",
    muted45: "rgba(235,237,239,0.45)",
    muted38: "rgba(235,237,239,0.38)",
    mark: "rgba(235,237,239,0.32)",
    hover: "rgba(235,237,239,0.08)",
    off: "#101214",
    skeleton: "#2a2d2f",
    onFill: "#0e1012",
    onFillSoft: "rgba(14,16,18,0.75)",
    onFillLine: "rgba(14,16,18,0.45)",
    n100: "#2c2e30", n200: "#36383b", n300: "#4b4d50",
    n400: "#7e8185", n500: "#93969a", n600: "#a2a5a8", // n400 clears 3:1 for borders
    err: "#dc655f",
    errDeep: "#ffaba3",
    toast: "#36383b",
  },
} as const;

/** Role ramps. `fill` carries the seat, `tint` is the quiet wash, `deep` is text on tint. */
const ROLES = {
  light: {
    fe: { short: "FE", fill: "#00736f", deep: "#004a46", mid: "#58b7b1", tint: "#def6f4" },
    mobile: { short: "MO", fill: "#724aab", deep: "#492676", mid: "#b49ce1", tint: "#f2edff" },
    be_l1: { short: "BE", fill: "#915c08", deep: "#603800", mid: "#d6a866", tint: "#feefdc" },
  },
  dark: {
    fe: { short: "FE", fill: "#3c9791", deep: "#acdcd8", mid: "#326f6b", tint: "#1b3735" },
    mobile: { short: "MO", fill: "#9274c5", deep: "#d8c7fa", mid: "#6b578f", tint: "#352c47" },
    be_l1: { short: "BE", fill: "#aa7c41", deep: "#e8ccaa", mid: "#7c5d34", tint: "#3e2e1b" },
  },
} as const;

type TokenName = keyof typeof TOKENS.light;
const cssVar = (name: string) => `var(--s-${name})`;

/** Read tokens as CSS variables: `T.rule` works in any mode without a hook. */
export const T = Object.fromEntries(
  (Object.keys(TOKENS.light) as TokenName[]).map((k) => [k, cssVar(k)]),
) as Record<TokenName, string> & { fontHeading: string; fontBody: string };
T.fontHeading = '"Barlow Condensed", system-ui, sans-serif';
T.fontBody = '"Barlow", system-ui, sans-serif';

export const ROLE: Record<SeatRole, { short: string; fill: string; deep: string; mid: string; tint: string }> = {
  fe: { short: "FE", fill: cssVar("fe-fill"), deep: cssVar("fe-deep"), mid: cssVar("fe-mid"), tint: cssVar("fe-tint") },
  mobile: { short: "MO", fill: cssVar("mobile-fill"), deep: cssVar("mobile-deep"), mid: cssVar("mobile-mid"), tint: cssVar("mobile-tint") },
  be_l1: { short: "BE", fill: cssVar("be_l1-fill"), deep: cssVar("be_l1-deep"), mid: cssVar("be_l1-mid"), tint: cssVar("be_l1-tint") },
};

/** The CSS that defines both palettes; injected once at the root. */
export function paletteCss() {
  const block = (mode: Mode) =>
    [
      ...Object.entries(TOKENS[mode]).map(([k, v]) => `--s-${k}:${v};`),
      ...Object.entries(ROLES[mode]).flatMap(([role, ramp]) =>
        (["fill", "deep", "mid", "tint"] as const).map((k) => `--s-${role}-${k}:${ramp[k]};`),
      ),
    ].join("");
  return `:root{color-scheme:light;${block("light")}}
html[data-mode="dark"]{color-scheme:dark;${block("dark")}}`;
}

export function buildTheme(mode: Mode): Theme {
  const t = TOKENS[mode];
  return createTheme({
    palette: {
      mode,
      primary: { main: t.accent, dark: t.accent700, contrastText: mode === "dark" ? "#0e1012" : "#fff" },
      error: { main: t.err, dark: t.errDeep },
      background: { default: t.bg, paper: t.bg },
      text: { primary: t.text, secondary: t.muted },
      divider: t.divider,
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
          outlined: { borderColor: T.text, color: T.text, "&:hover": { background: T.hover, borderColor: T.text } },
          contained: { background: T.accent, color: t.bg, "&:hover": { background: T.accent700 } },
          text: { color: T.text, "&:hover": { background: T.hover } },
        },
      },
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none", backgroundColor: T.bg } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${T.rule}`, padding: "10px 7px", fontSize: 14, color: T.text },
          head: { fontFamily: T.fontBody, fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, borderBottom: `1px solid ${T.text}` },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 0, height: 24, fontSize: 12 } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 0, background: T.raised, "& fieldset": { borderColor: T.divider }, "&:hover fieldset": { borderColor: T.text }, "&.Mui-focused fieldset": { borderWidth: 1, borderColor: T.accent } },
        },
      },
      MuiToggleButton: {
        styleOverrides: { root: { borderRadius: 0, textTransform: "none", fontFamily: T.fontBody, fontSize: 12, padding: "4px 10px", borderColor: T.divider, color: T.text } },
      },
      MuiDrawer: { styleOverrides: { paper: { background: T.bg, borderLeft: `1px solid ${T.divider}` } } },
      MuiDialog: { styleOverrides: { paper: { background: T.bg, border: `1px solid ${T.divider}` } } },
      MuiMenu: { styleOverrides: { paper: { background: T.bg } } },
      MuiTab: { styleOverrides: { root: { textTransform: "none", fontFamily: T.fontBody, fontSize: 14, minHeight: 40, padding: "8px 14px", color: T.muted, "&.Mui-selected": { color: T.text } } } },
      MuiTabs: { styleOverrides: { indicator: { height: 2, background: T.accent } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 0 } } },
      MuiSkeleton: { styleOverrides: { root: { background: T.skeleton, borderRadius: 0 } } },
      MuiSwitch: { styleOverrides: { track: { backgroundColor: T.n400 } } },
      MuiCssBaseline: {
        styleOverrides: {
          "*:focus-visible": { outline: `2px solid ${T.accent}`, outlineOffset: 2 },
          "::selection": { background: T.accentSoft },
          body: { backgroundColor: T.bg, color: T.text },
        },
      },
    },
  });
}

/** Default export kept so any stray import of `theme` still resolves. */
export const theme = buildTheme("light");
