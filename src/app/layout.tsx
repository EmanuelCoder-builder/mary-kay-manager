import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Caderno Rosa | Gestão Mary Kay",
  description: "Web app mobile-first para consultoras Mary Kay gerenciarem clientes, vendas parceladas e cobranças via WhatsApp.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Caderno Rosa",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F2F2F7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F2F2F7] text-[#1C1C1E] font-sans selection:bg-rose-200 selection:text-rose-900">
        {children}
      </body>
    </html>
  );
}
