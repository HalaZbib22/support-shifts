import Box from "@mui/material/Box";
import { T } from "@/lib/theme";

export function BrandMark({ size = 16 }: { size?: number }) {
  return (
    <Box component="span" sx={{ width: size, height: size, border: `1.5px solid ${T.text}`, display: "inline-block", position: "relative", flex: "none" }}>
      <Box component="span" sx={{ position: "absolute", inset: 3, background: T.accent }} />
    </Box>
  );
}

export function Brand({ size = 18 }: { size?: number }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, fontFamily: T.fontHeading, fontWeight: 600, fontSize: size, color: T.text, textDecoration: "none" }}>
      <BrandMark size={size - 2} />
      Support Shifts
    </Box>
  );
}
