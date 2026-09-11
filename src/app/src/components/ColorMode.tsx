"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Mode } from "@/lib/theme";

export type ModePref = Mode | "system";

interface Ctx {
  pref: ModePref;
  mode: Mode; // resolved
  setPref: (p: ModePref) => void;
}

const ColorModeCtx = createContext<Ctx>({ pref: "system", mode: "light", setPref: () => {} });
const KEY = "support-shifts-mode";

/** Runs before paint to set the attribute, so there's no light flash on a dark-mode load. */
export const NO_FLASH_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(KEY)})||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-mode",d?"dark":"light")}catch(e){}})()`;

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ModePref>("system");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY) as ModePref | null;
    if (stored === "light" || stored === "dark" || stored === "system") setPrefState(stored);
    const mq = matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const mode: Mode = pref === "system" ? (systemDark ? "dark" : "light") : pref;

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  const setPref = (p: ModePref) => {
    setPrefState(p);
    try {
      localStorage.setItem(KEY, p);
    } catch {
      // Private browsing: the choice just won't persist.
    }
  };

  return <ColorModeCtx.Provider value={{ pref, mode, setPref }}>{children}</ColorModeCtx.Provider>;
}

export function useColorMode() {
  return useContext(ColorModeCtx);
}
