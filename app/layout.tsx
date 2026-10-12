import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finora — Your money, in focus",
  description: "Beautiful personal finance management for budgets, expenses, debts, bills, goals and accounts.",
  applicationName: "Finora",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
