import Box from "@mui/material/Box";
import { T } from "@/lib/theme";
import { initials } from "@/lib/format";

export function Initials({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <Box sx={{ width: size, height: size, border: "1px solid rgba(29,31,32,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: T.fontHeading, fontWeight: 600, fontSize: size * 0.43, flex: "none" }}>
      {initials(name)}
    </Box>
  );
}
