import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatDock } from "@/components/ui";
import { ThemeLogo } from "@/components/ui/theme-logo";
import { ScrollableHeader } from "../components/scrollable-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Happy Journey",
  description: "Happy Journey",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logoDark.png", media: "(prefers-color-scheme: dark)", type: "image/png", sizes: "32x32" },
      { url: "/logowhite.png", media: "(prefers-color-scheme: light)", type: "image/png", sizes: "32x32" }
    ],
    apple: [
      { url: "/logoDark.png", type: "image/png", sizes: "180x180" }
    ],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning={true}
        >
          <ScrollableHeader />
          <div className="pt-16 sm:pt-20 md:pt-24">
            {children}
          </div>
          <ChatDock />
        </body>
      </html>
    </ClerkProvider>
  );
}