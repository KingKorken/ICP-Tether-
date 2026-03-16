import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Revenue Simulator — Tether",
  description:
    "Discover your EV charging revenue potential with Tether's interactive Revenue Simulator. See projected earnings from e-credits and grid flexibility.",
  openGraph: {
    title: "The Revenue Simulator — Tether",
    description:
      "Discover your EV charging revenue potential with Tether's Revenue Simulator.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="font-sans text-brand-dark bg-brand-light antialiased">
        {children}
      </body>
    </html>
  );
}
