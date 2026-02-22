import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Central Grand — Smart Mall Directory",
  description: "ผู้ช่วยอัจฉริยะสำหรับค้นหาร้านค้า โปรโมชัน และข้อมูลในห้างสรรพสินค้า",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${notoSansThai.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
