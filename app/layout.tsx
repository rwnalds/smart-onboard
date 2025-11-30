import { StackProvider, StackTheme } from "@stackframe/stack";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { stackClientApp } from "../stack/client";
import { SyncUserToExtension } from "./sync-user-to-extension";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartOnboard AI",
  description: "AI-powered client onboarding platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <SyncUserToExtension />
            {children}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
