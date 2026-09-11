"use client";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { T } from "@/lib/theme";

/** Industry's wireframe frame: square, hairline border, "+" registration marks at the corners. */
export function Blueprint({ children, sx, component = "div", ...rest }: { children: React.ReactNode; sx?: SxProps<Theme>; component?: React.ElementType } & Record<string, unknown>) {
  return (
    <Box
      component={component}
      sx={[
        { position: "relative", border: `1px solid ${T.divider}`, "& > .corner": { position: "absolute", width: 11, height: 11, color: T.muted, pointerEvents: "none" }, "& > .corner::before": { content: '""', position: "absolute", left: 5, top: 0, width: 1, height: "100%", background: "currentColor" }, "& > .corner::after": { content: '""', position: "absolute", top: 5, left: 0, width: "100%", height: 1, background: "currentColor" }, "& > .tl": { top: -6, left: -6 }, "& > .tr": { top: -6, right: -6 }, "& > .bl": { bottom: -6, left: -6 }, "& > .br": { bottom: -6, right: -6 } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      {children}
    </Box>
  );
}
