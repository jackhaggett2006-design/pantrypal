import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
  title: "PantryPal",
  description:
    "Snap your groceries, track your macros, and cook from what you already have.",
  // iOS ignores the web manifest for "Add to Home Screen" — these meta tags are
  // what make it launch standalone (no browser chrome) with the right title/icon.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PantryPal",
  },
};

export const viewport: Viewport = {
  themeColor: "#17181d",
  width: "device-width",
  initialScale: 1,
  // Lets content extend under the iPhone notch/home-indicator in standalone
  // mode; combine with env(safe-area-inset-*) padding where it matters.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
