import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blank Project",
  description: "Ready to start again"
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
