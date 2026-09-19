import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PerfectPost Maison",
  description: "Tracker LinkedIn personnel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
