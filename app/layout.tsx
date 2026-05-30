import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITSM Inventory",
  description: "Internal IT asset inventory system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
