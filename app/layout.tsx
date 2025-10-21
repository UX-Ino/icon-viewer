import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Icon Viewer",
  description: "An application to view and manage icons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
