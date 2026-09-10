import Box from "@mui/material/Box";
import { T } from "@/lib/theme";

type Variant = "accent" | "neutral" | "outline" | "error";

const STYLES: Record<Variant, object> = {
  accent: { background: "#d6ebff", color: T.accent800, border: "1px solid transparent" },
  neutral: { background: T.n200, color: T.text, border: "1px solid transparent" },
  outline: { background: "transparent", color: T.text, border: `1px solid ${T.divider}` },
  error: { background: "transparent", color: T.errDeep, border: `1px solid ${T.err}` },
};

export function Tag({ variant = "neutral", children, small }: { variant?: Variant; children: React.ReactNode; small?: boolean }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, height: small ? 18 : 24, padding: small ? "0 6px" : "0 9px", fontSize: small ? 10 : 12, fontWeight: 500, whiteSpace: "nowrap", ...STYLES[variant] }}>
      {children}
    </Box>
  );
}
