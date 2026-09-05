import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { AuthSync } from "@/components/auth-sync";
import { PwaRegister } from "@/components/pwa-register";
import { DeckProvider } from "@/lib/deck-context";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Flick — simple flashcards",
  description:
    "Add a word, its English translation, and an example. Flip the card. Swipe yes or no.",
  applicationName: "Flick",
  appleWebApp: {
    capable: true,
    title: "Flick",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#c47a3a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <DeckProvider>
          <AuthSync />
          {children}
        </DeckProvider>
      </body>
    </html>
  );
}
