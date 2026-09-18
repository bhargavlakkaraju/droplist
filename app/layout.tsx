import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DropList — the AI not-to-do coach",
  description:
    "Paste your messy brain dump. Get a ruthless not-to-do list: DROP, DELAY, DELEGATE — each with one short reason. English + Hindi.",
  openGraph: {
    title: "DropList — the AI not-to-do coach",
    description:
      "One paste → relief. DROP / DELAY / DELEGATE with reasons, in English or Hindi.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900">{children}</body>
    </html>
  );
}
