import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finora — Your financial command center",
  description: "A beautifully organized finance workspace for personal cash flow, business expenses, investments, taxes, reports and Zakat planning.",
  applicationName: "Finora",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
