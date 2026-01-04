import type { Metadata } from "next";
import { EB_Garamond, Xanh_Mono } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const xanhMono = Xanh_Mono({
  variable: "--font-xanh-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Simon Design Library",
  description: "A mobile archive of selected materials",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${ebGaramond.variable} ${xanhMono.variable} antialiased h-full`}
      >
        {children}
      </body>
    </html>
  );
}
