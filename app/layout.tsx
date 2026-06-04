import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Service Management",
  description: "IT Service Management inventory and workflow system"
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
