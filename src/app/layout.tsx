import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Collab Docs",
  description: "A lightweight collaborative document editor",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        {children}
      </body>
    </html>
  );
}
