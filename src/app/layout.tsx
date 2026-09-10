import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Support Shifts",
  description: "Out-of-hours support shift registration",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f2f2f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
