import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Krishnaji Flute — Bansuri Dhyaan",
  description:
    "A serene listening room for Krishna bansuri meditation music. Free, ad-free, forever. Made by Lostt Weeds.",
  keywords: [
    "Krishna flute",
    "bansuri",
    "meditation music",
    "Krishnaji Flute",
    "Lostt Weeds",
  ],
  authors: [{ name: "Lostt Weeds" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon-32.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Krishnaji Flute — Bansuri Dhyaan",
    description:
      "A serene listening room for Krishna bansuri meditation music. Free & ad-free.",
    type: "website",
    images: ["/flute-bg.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krishnaji Flute",
    description: "Bansuri dhyaan — free, ad-free, forever.",
    images: ["/flute-bg.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0608",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
