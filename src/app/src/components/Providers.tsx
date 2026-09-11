"use client";
import { useMemo } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { buildTheme, paletteCss } from "@/lib/theme";
import { AuthProvider } from "./AuthProvider";
import { ColorModeProvider, useColorMode } from "./ColorMode";

function Themed({ children }: { children: React.ReactNode }) {
  const { mode } = useColorMode();
  const theme = useMemo(() => buildTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={paletteCss()} />
      <CssBaseline />
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ColorModeProvider>
        <Themed>{children}</Themed>
      </ColorModeProvider>
    </AppRouterCacheProvider>
  );
}
