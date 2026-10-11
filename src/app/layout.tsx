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
  title: "Mary Kay Manager | Gestão e Cobrança",
  description: "Web app mobile-first para consultoras Mary Kay gerenciarem clientes, vendas parceladas e cobranças via WhatsApp.",
  icons: {
    icon: "/favicon.ico",
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
