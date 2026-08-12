import type { Metadata } from "next";
import { Inter, Noto_Serif_SC, Playfair_Display, DM_Sans, Space_Grotesk, Caveat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700"],
  variable: "--font-serif",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-dm",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-space",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.acetrip.cn'),
  title: {
    default: 'AceTrip - WTA 女子网球赛事与球员数据平台',
    template: '%s',
  },
  description: 'AceTrip 汇集 WTA 女子网球赛事、球员排名、赛程赛果与历史交手数据。',
  keywords: ["WTA", "网球", "旅行", "赛事", "女子网球", "AceTrip"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSerifSC.variable} ${playfair.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${caveat.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
        <Header />
        <main className="min-h-screen pb-20 md:pb-0">
          {children}
        </main>
        <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
